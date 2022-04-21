# anchor-solana-twitter

Twitter application on the Solana blockchain user the Anchor framework

A big thanks goes out to [Loris Leiva](https://github.com/lorisleiva).
Who's tutorial series [Create a Solana dApp from scratch](https://lorisleiva.com/create-a-solana-dapp-from-scratch) served as a great learning resource for this project.

The functionalities that were added on top of the free part of the series are:

- Edit tweets<br>
	Which involves a check if the tweet has changed. If yes, update it and mark it as edited.

- Users can delete their own tweets

- Rate tweets<br>
	Up- / Down vote

Furthermore, it was updated to run with the newest version of anchor (v24.02 TD).

_(Assuming Solana and anchor are installed)_
`npm i` installs some dependencies to then build and run the CLI test-application with `anchor test`.

The functionalities can be implemented in an frontend build in the framework of preference.
