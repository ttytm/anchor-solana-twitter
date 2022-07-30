# anchor-solana-twitter

Extends and refactors the v1-branch.

## Major changes

-  Votings are their own account using PDAs, instead of just updating a counter on an existing tweet

   -  enables to filter votings for a user
   -  less costs for sending a vote
   -  the `rating` counter on tweets becomes obsolete, which results in slimmer tweet accounts

-  Direct messages are separate accounts instead of being a tweet

   -  less cost on for dms
   -  `recipient` on tweet account becomes obsolete

-  Comment functionality

-  Users can create aliases

-  New api syntax for tests

   -  abandon deprecated `.rpc` in favor of `.methods` syntax

## Tests

The installation of the prerequisites to run an anchor program, is nicely explained in the [anchor book][1].

Having the prerequisites out of the way, the `yarn` command will load some program dependencies.

To then be able to run the tests: update the path of **`wallet`** in the `Anchor.toml` file under the `[provider]` section according to your systems configuration. Usually, it should be enough to change the `<username>` in the home path.

Building and running the test can be done with `anchor test`.

To use the tests while working on a frontend run the localnet with `anchor localnet`.<br>
In another terminal airdrop your wallet some SOL and load the test `solana airdrop 1000 <YourPhantomWalletPubKey> && anchor run test`.

### Tested functionalities

```
❯ anchor test                                                                                              
anchor-solana-twitter
	tweets
		✔ can send and update tweets
		✔ can send a tweet without a tag
		✔ cannot send a tweet without content
		✔ cannot send a tweet with a tag > 50 or content > 280 characters
		✔ cannot update a tweet without changes
		✔ can delete own tweets
		✔ can fetch and filter tweets
	comments
		✔ can send, update and delete comments
	votings
		✔ can vote and update votings for tweets
		✔ can derive tweets from a users votings
	direct messages
		✔ can send a direct message to another user
		✔ can fetch and filter a users direct messages
	user alias
		✔ can create, update and delete a user alias
```

[1]: https://book.anchor-lang.com/getting_started/installation.html

