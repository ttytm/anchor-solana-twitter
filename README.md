## Backend for a twitter application on the Solana blockchain

It was written based on [Loris Leiva's](https://github.com/lorisleiva) tutorial series: [Create a Solana dApp from scratch](https://lorisleiva.com/create-a-solana-dapp-from-scratch)

The functionalities that were added on top of the free guide are:

- Edit tweets
 Check if the tweet has changed. If yes, update it and mark it as edited

- Delete tweets

- Rate tweets
 Up- / Down vote

Furthermore, it was updated to run with the newest version of anchor (v24.02 TD).

Run `npm i` to install some dependencies to build and run the test CLI application with `anchor test`.
_(Assuming Solana and anchor are installed)_

The given functionalities can be used to build a frontend in a framework of preference.
