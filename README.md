## Lobby application

The entrance of data to indyva systems

### Install electron (global)

	$ sudo npm install electron -g

### Install node_modules

	# From dir .../webapp/web run:
	$ npm install

	# Recommended versions:
	react-bootstrap@0.25.2
	react@0.13.3

	NOTE: react-dom isn't necessary, remove ($ npm remove react-dom) if it gives problems

### Run Lobby with electron (once ran indyva on correct port):

	# From dir .../webapp run:
	$ electron . [data_dir]
