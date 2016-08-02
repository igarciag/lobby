import React, { PropTypes } from 'react';
import _ from 'lodash';
import remote from 'remote';
import ReactGridLayout from 'react-grid-layout';
import {Button} from 'react-bootstrap';
import { connect } from 'react-redux';
import { ActionCreators } from 'redux-undo';

import {setOrder, toggleCardExpansion, setAttrLabel, setAttrType, setAttrOrder,
    fetchDistinctValues, setCardHeight} from './actions';
import Card from './card';
import ToolBar from './toolbar';

let hashCode = function(str) {
    let hash = 0, i, chr, len;
    if (str.length === 0) return hash;
    for (i = 0, len = str.length; i < len; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

const Editor = React.createClass({
    orderFromLayout(layout) {
        return _.chain(layout)
        .map( (l) => { return {y: l.y, attr: l.attr} })
        .sortBy('y')
        .pluck('attr')
        .value();
    },
    onAttrTypeChanged(attrName, attrType) {
        const tableName = this.props.table.tableName;
        this.props.dispatch(setAttrType(attrName, attrType));
        if (attrType === "ORDINAL") {
            this.props.dispatch(fetchDistinctValues(tableName, attrName))
            .then((action) => {
                this.props.dispatch(setAttrOrder(attrName, action.values))
                const cardHeight = Math.ceil(action.values.length / 25) + 2;
                this.props.dispatch(setCardHeight(attrName, cardHeight));
            });
        } else { // Only ORDINAL attributes have order
            this.props.dispatch(setCardHeight(attrName, 2));
            this.props.dispatch(setAttrOrder(attrName, null));
        }
    },
    render() {
        const rowHeight = 45;
        const expandedRows = 2;
        const dispatch = this.props.dispatch;
        const cards = this.props.cards.present;
        const attributes = this.props.attributes.present.attrsByName;
        const order = this.props.attributes.present.order;

        // Compute the layout from state.order and state.expanded
        let _lastY = 0;
        let layout = _.map(order, (attrName, i) => {
            // let height = (cards[attrName].expanded)? cards[attrName].height * expandedRows : 1;
            // _lastY += height;
            let height = cards[attrName].expanded ? cards[attrName].height * expandedRows : 1;
            _lastY += height;
            let result = {x:0, y: _lastY, w: 1, h: height, i:"c"+hashCode(attrName), attr:attrName, handle:".card-anchor"}
            return result;
        })

        return (
            <div className="board">

                <ToolBar
                    onUndoClick={() => dispatch(ActionCreators.undo()) }
                    onRedoClick={() => dispatch(ActionCreators.redo()) }
                    startAnalysisEnabled={true}
                    onStartAnalysisClick={() => { this.props.history.pushState(this.props.history.state, "/launch")} }
                    >
                </ToolBar>

                <ReactGridLayout className="layout"
                    layout={layout}
                    cols={1}
                    rowHeight={rowHeight}
                    useCSSTransforms={true}
                    isResizable={false}
                    onLayoutChange={(newLayout) => {
                        let newOrder = this.orderFromLayout(newLayout);
                        if (! _.isEqual(order, newOrder)) {  // Avoids infinite recursion
                            dispatch(setOrder(newOrder));
                        }
                    }}
                    onResizeStop={(layout) => dispatch(setOrder( this.orderFromLayout(layout) )) }
                    >
                    {
                        order.map((attrName, i) => {
                            let attrType = attributes[attrName]["attribute_type"];
                            let attrLabel = attributes[attrName]["label"];
                            let attrOrder = attributes[attrName].meta.order;
                            return (
                                <div key={"c"+hashCode(attrName)}>
                                    <Card
                                        attrLabel={attrLabel}
                                        attrType={attrType}
                                        attrOrder={attrOrder}
                                        order={i + 1}
                                        expanded={cards[attrName].expanded}
                                        onAttrLabelChanged={(ev) => dispatch(setAttrLabel(attrName, ev.target.value))}
                                        onAttrTypeChanged={(ev) => this.onAttrTypeChanged(attrName, ev.target.value)}
                                        onHeaderClick={() => dispatch(toggleCardExpansion(attrName))}
                                        onAttrOrderChanged={(order) => {dispatch(setAttrOrder(attrName, order))}}
                                        />
                                </div>
                            );
                        })
                    }
                </ReactGridLayout>
            </div>
        );
    }
})

export default connect((state) => state)(Editor);
