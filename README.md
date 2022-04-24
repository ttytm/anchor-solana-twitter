# anchor-solana-twitter

A Twitter like application on the Solana blockchain. Developed using the Anchor framework.

_(Assuming Solana and anchor are installed)_<br>
`npm i` installs some dependencies to then build and run the CLI test-application with `anchor test`.

The functionalities can be implemented in any frontend build in the framework of preference.

---

Kudos to [Loris Leiva][1].
Who's tutorial series [Create a Solana dApp from scratch][2] served as a great learning resource for this project.

The functionalities that were added on top of the free part of the series are:

- Edit
  Which involves a check if the tweet has changed. If yes, update the tweet accordingly and mark it as edited.

- Delete tweets

- Up- / Down-vote tweets

- Send direct messages to other users

Furthermore, it was updated to run with the newest version of anchor (v24.02 TD).

[1]: https://github.com/lorisleiva
[2]: https://lorisleiva.com/create-a-solana-dapp-from-scratch
