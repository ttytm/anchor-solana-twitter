import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaTwitter } from "../target/types/solana_twitter";
import * as assert from "assert";
import * as bs58 from "bs58";

describe("solana-twitter", () => {
	const program = anchor.workspace.SolanaTwitter as Program<SolanaTwitter>;
	const provider = anchor.AnchorProvider.local();

	const sendTweet = async (user, tag, content) => {
		const tweetKeys = anchor.web3.Keypair.generate();
		await program.rpc.sendTweet(tag, content, {
			accounts: {
				tweet: tweetKeys.publicKey,
				user,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			signers: [tweetKeys],
		});

		return tweetKeys;
	};

	// Tweet 1
	it("can send a new tweet", async () => {
		const tweetKeys = anchor.web3.Keypair.generate();
		await program.rpc.sendTweet("veganism", "Hummus, am i right 🧆?", {
			accounts: {
				tweet: tweetKeys.publicKey,
				user: provider.wallet.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			signers: [tweetKeys],
		});

		// Fetch the created tweet
		const tweet = await program.account.tweet.fetch(tweetKeys.publicKey);

		// Ensure it has the right data
		assert.equal(tweet.user.toBase58(), provider.wallet.publicKey.toBase58());
		assert.equal(tweet.tag, "veganism");
		assert.equal(tweet.content, "Hummus, am i right 🧆?");
		assert.ok(tweet.timestamp);
		// console.log('Sent tweet :', tweetAccount);
	});

	// Tweet 2
	it("can send a new tweet without a tag", async () => {
		const tweetKeys = anchor.web3.Keypair.generate();
		await program.rpc.sendTweet("", "gm", {
			accounts: {
				tweet: tweetKeys.publicKey,
				user: provider.wallet.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			signers: [tweetKeys],
		});

		// Fetch the created tweet
		const tweet = await program.account.tweet.fetch(tweetKeys.publicKey);

		// Ensure it has the right data
		assert.equal(tweet.user.toBase58(), provider.wallet.publicKey.toBase58());
		assert.equal(tweet.tag, "");
		assert.equal(tweet.content, "gm");
		assert.ok(tweet.timestamp);
		// console.log('Tweet sent without a tag: ', tweet);
	});

	// Generate another user
	let otherUser = anchor.web3.Keypair.generate();

	// Tweet 3
	it("can send a new tweet from a different user", async () => {
		// Airdrop some SOL
		const signature = await provider.connection.requestAirdrop(
			otherUser.publicKey,
			1000000000
		);
		await provider.connection.confirmTransaction(signature);

		const tweetKeys = anchor.web3.Keypair.generate();
		await program.rpc.sendTweet("veganism", "Yay Tofu 🍜!", {
			accounts: {
				tweet: tweetKeys.publicKey,
				user: otherUser.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			signers: [otherUser, tweetKeys],
		});

		// Fetch the created tweet
		const tweet = await program.account.tweet.fetch(tweetKeys.publicKey);

		// Ensure it has the right data
		assert.equal(tweet.user.toBase58(), otherUser.publicKey.toBase58());
		assert.equal(tweet.tag, "veganism");
		assert.equal(tweet.content, "Yay Tofu 🍜!");
		assert.ok(tweet.timestamp);
		// console.log('Tweet by different user: ', tweet);
	});

	it("cannot provide a tag with more than 50 characters", async () => {
		try {
			const tweetKeys = anchor.web3.Keypair.generate();
			const tagWith51Chars = "x".repeat(51);
			await program.rpc.sendTweet(tagWith51Chars, "Hummus, am I right?", {
				accounts: {
					tweet: tweetKeys.publicKey,
					user: provider.wallet.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				signers: [tweetKeys],
			});
		} catch (err) {
			assert.equal(
				err.error.errorMessage,
				"Exceeding maximum tag length of 50 characters."
			);
			return;
		}

		assert.fail("The instruction should have failed with a 51-character tag.");
	});

	it("cannot provide a content with more than 280 characters", async () => {
		try {
			const tweetKeys = anchor.web3.Keypair.generate();
			const contentWith281Chars = "x".repeat(281);
			await program.rpc.sendTweet("veganism", contentWith281Chars, {
				accounts: {
					tweet: tweetKeys.publicKey,
					user: provider.wallet.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				signers: [tweetKeys],
			});
		} catch (err) {
			assert.equal(
				err.error.errorMessage,
				"Exceeding maximum content length of 280 characters."
			);
			return;
		}

		assert.fail(
			"The instruction should have failed with a 281-character content."
		);
	});

	it("can fetch all tweets", async () => {
		const tweets = await program.account.tweet.all();
		assert.equal(tweets.length, 3);
	});

	it("can filter tweets by user", async () => {
		const userPublicKey = provider.wallet.publicKey;
		const tweets = await program.account.tweet.all([
			{
				memcmp: {
					offset: 8, // Discrimminator
					bytes: userPublicKey.toBase58(),
				},
			},
		]);

		// Check if the fetched amout of tweets is equal to those the user sent
		assert.equal(tweets.length, 2);
		assert.ok(
			tweets.every((tweetAccount) => {
				return (
					tweetAccount.account.user.toBase58() === userPublicKey.toBase58()
				);
			})
		);
		// console.log('Tweets filtered by user: ', tweets);
	});

	it("can filter tweets by tags", async () => {
		const tweets = await program.account.tweet.all([
			{
				memcmp: {
					offset:
						8 + // Discriminator.
						32 + // User public key.
						8 + // Timestamp.
						4, // Tag string prefix.
					bytes: bs58.encode(Buffer.from("veganism")),
				},
			},
		]);

		assert.equal(tweets.length, 2);
		assert.ok(
			tweets.every((tweetAccount) => {
				return tweetAccount.account.tag === "veganism";
			})
		);
		// console.log('Tweets filtered by tag: ', tweets);
	});

	// Tweet 4
	it("can update a tweet", async () => {
		const user = provider.wallet.publicKey;
		// Use the sendTweet function to call the "SendTweet" instruction
		// ... send another tweet from the programs provider.wallet which anchor automatically signs with its keypair
		const tweet = await sendTweet(user, "web3", "takes over");

		// Fetch its details
		const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

		// Check if it was received correctly
		assert.equal(tweetAccount.tag, "web3");
		assert.equal(tweetAccount.content, "takes over");
		assert.equal(tweetAccount.edited, false);

		// Update the tweet
		await program.rpc.updateTweet("baneyneys", "And lobsters!", {
			accounts: {
				tweet: tweet.publicKey,
				user,
			},
		});

		// Check if the tweet was updated
		const updatedTweetAccount = await program.account.tweet.fetch(
			tweet.publicKey
		);
		assert.equal(updatedTweetAccount.tag, "baneyneys");
		assert.equal(updatedTweetAccount.content, "And lobsters!");
		assert.equal(updatedTweetAccount.edited, true);
	});

	// Tweet 5
	it("cannot update a tweet that wasn't changed", async () => {
		try {
			const user = provider.wallet.publicKey;
			const tweet = await sendTweet(user, "web3", "takes over!");
			const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

			// Check if it was received correctly
			assert.equal(tweetAccount.tag, "web3");
			assert.equal(tweetAccount.content, "takes over!");
			assert.equal(tweetAccount.edited, false);

			await program.rpc.updateTweet("web3", "takes over!", {
				accounts: {
					tweet: tweet.publicKey,
					user,
				},
			});
		} catch (err) {
			assert.equal(err.error.errorMessage, "Nothing that could be updated.");
			return;
		}

		assert.fail(
			"The instruction should have failed with a tweet without changes."
		);
	});

	// Tweet 6
	it("can upvote a tweet", async () => {
		const goodTweet = anchor.web3.Keypair.generate();

		await program.rpc.sendTweet(
			"opensource",
			"don't forget about the GNU in linux 🦬",
			{
				accounts: {
					tweet: goodTweet.publicKey,
					user: otherUser.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				signers: [otherUser, goodTweet],
			}
		);
		const tweetAccount = await program.account.tweet.fetch(goodTweet.publicKey);

		// Check that the tweet has no rating yet
		assert.ok(tweetAccount.rating == 0);

		// Upvote the tweet
		await program.rpc.upvoteTweet({
			accounts: {
				tweet: goodTweet.publicKey,
			},
		});

		// Check if the tweet was upvoted
		const upvotedTweetAccount = await program.account.tweet.fetch(
			goodTweet.publicKey
		);

		assert.ok(upvotedTweetAccount.rating == 1);
		console.log("Rating: ", upvotedTweetAccount.rating);
	});

	// Define on global scope so it can be downvoted multiple times
	let badTweet;

	// Tweet 7
	it("can downvote a tweet", async () => {
		// Airdrop some SOL
		const confusedUser = anchor.web3.Keypair.generate();
		const signature = await provider.connection.requestAirdrop(
			confusedUser.publicKey,
			1000000000
		);
		await provider.connection.confirmTransaction(signature);

		badTweet = anchor.web3.Keypair.generate();
		await program.rpc.sendTweet("hejustwantsourbest", "i like bill gates", {
			accounts: {
				tweet: badTweet.publicKey,
				user: confusedUser.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			signers: [confusedUser, badTweet],
		});

		const badTweetAccount = await program.account.tweet.fetch(
			badTweet.publicKey
		);
		// Check that the tweet has no rating yet
		assert.ok(badTweetAccount.rating == 0);

		// Downvote that tweet
		await program.rpc.downvoteTweet({
			accounts: {
				tweet: badTweet.publicKey,
			},
		});

		// Check if the tweet was downvoted
		const downvotedTweetAccount = await program.account.tweet.fetch(
			badTweet.publicKey
		);

		assert.ok(downvotedTweetAccount.rating == -1);
		console.log("Rating: ", downvotedTweetAccount.rating);
	});

	it("can downvote a tweet again", async () => {
		const badTweetAccount = await program.account.tweet.fetch(
			badTweet.publicKey
		);
		// Check that the tweet was downvoted already
		assert.ok(badTweetAccount.rating == -1);

		// Downvote the tweet again
		await program.rpc.downvoteTweet({
			accounts: {
				tweet: badTweet.publicKey,
			},
		});

		// Check if the tweet was downvoted again
		const downvotedTweetAccount = await program.account.tweet.fetch(
			badTweet.publicKey
		);

		assert.ok(downvotedTweetAccount.rating == -2);
		console.log("Rating: ", downvotedTweetAccount.rating);
	});
});
