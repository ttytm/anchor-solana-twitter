import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { AnchorSolanaTwitter } from "../target/types/anchor_solana_twitter";
import type { PublicKey as PublicKeyType } from "@solana/web3.js";
import type { Keypair } from "@solana/web3.js";
import * as assert from "assert";
import * as bs58 from "bs58";

describe("anchor-solana-twitter", () => {
	const program = anchor.workspace.AnchorSolanaTwitter as Program<AnchorSolanaTwitter>;
	const programProvider = anchor.AnchorProvider.env()

	// Configure the client to use the local cluster.
	anchor.setProvider(programProvider);

	// Generate Users
	const userOne = programProvider.wallet;
	const otherUser = anchor.web3.Keypair.generate();
	const confusedUser = anchor.web3.Keypair.generate();

	// Tweet 1
	it("can send a new tweet", async () => {
		const tweetKeypair = anchor.web3.Keypair.generate();
		await program.rpc.sendTweet("veganism", "Hummus, am i right 🧆?", null, {
			accounts: {
				tweet: tweetKeypair.publicKey,
				user: userOne.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			// Anchor automatically signs with the conneted wallets keypair 
			// in scope of this test it's the program's provider.wallet
			signers: [tweetKeypair],
		});

		// Fetch the created tweet
		const tweet = await program.account.tweet.fetch(tweetKeypair.publicKey);

		// Ensure it has the right data
		assert.equal(tweet.user.toBase58(), programProvider.wallet.publicKey.toBase58());
		assert.equal(tweet.tag, "veganism");
		assert.equal(tweet.content, "Hummus, am i right 🧆?");
		assert.ok(tweet.timestamp);
		// console.log('Sent tweet :', tweet);
	});

	// Tweet 2
	it("can send a new tweet without a tag", async () => {
		const tweetKeypair = anchor.web3.Keypair.generate();
		await program.rpc.sendTweet("", "gm", null, {
			accounts: {
				tweet: tweetKeypair.publicKey,
				user: programProvider.wallet.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			signers: [tweetKeypair],
		});

		// Fetch the created tweet
		const tweet = await program.account.tweet.fetch(tweetKeypair.publicKey);

		// Ensure it has the right data
		assert.equal(tweet.user.toBase58(), programProvider.wallet.publicKey.toBase58());
		assert.equal(tweet.tag, "");
		assert.equal(tweet.content, "gm");
		assert.ok(tweet.timestamp);
		// console.log('Tweet sent without a tag: ', tweet);
	});

	// Tweet 3
	it("can send a new tweet from a different user", async () => {
		// Airdrop some SOL
		const signature = await programProvider.connection.requestAirdrop(
			otherUser.publicKey,
			1000000000
		);
		await programProvider.connection.confirmTransaction(signature);

		const tweetKeypair = anchor.web3.Keypair.generate();
		await program.rpc.sendTweet("veganism", "Yay Tofu 🍜!", null, {
			accounts: {
				tweet: tweetKeypair.publicKey,
				user: otherUser.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			signers: [otherUser, tweetKeypair],
		});

		// Fetch the created tweet
		const tweet = await program.account.tweet.fetch(tweetKeypair.publicKey);

		// Ensure it has the right data
		assert.equal(tweet.user.toBase58(), otherUser.publicKey.toBase58());
		assert.equal(tweet.tag, "veganism");
		assert.equal(tweet.content, "Yay Tofu 🍜!");
		assert.ok(tweet.timestamp);
		// console.log('Tweet by different user: ', tweet);
	});

	// Helper functions to call the "SendTweet" instruction to stop repeating ourselfs
	const sendTweet = async (tweetKeypair: Keypair, user, tag: string, content: string, recepient: PublicKeyType) => {
		// Anchor nests the provider.wallet keypair inside a payer object 
		// use 'user.payer' as 'oser' if tweet is sent from the provider.wallet
		user.payer != null ? user = user.payer : user
		// recepient == recepient || user.publicKey

		await program.rpc.sendTweet(tag, content, recepient, {
			accounts: {
				tweet: tweetKeypair.publicKey,
				user: user.publicKey,
				systemProgram: anchor.web3.SystemProgram.programId,
			},
			signers: [tweetKeypair, user],
		});
	};

	it("cannot provide a tag with more than 50 characters", async () => {
		try {
			const tweetKeypair = anchor.web3.Keypair.generate();
			const tagWith51Chars = "x".repeat(51);
			await sendTweet(tweetKeypair, userOne, tagWith51Chars, "takes over!", null);
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
			const tweetKeypair = anchor.web3.Keypair.generate();
			const contentWith281Chars = "x".repeat(281);
			await sendTweet(tweetKeypair, userOne, "veganism", contentWith281Chars, null);
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

	// Tweet 4
	it("can send a tweet to another user", async () => {
		const tweetKeypair = anchor.web3.Keypair.generate();
		await sendTweet(tweetKeypair, userOne, "Hello", "Whats up?", otherUser.publicKey);

		const tweet = await program.account.tweet.fetch(tweetKeypair.publicKey);

		assert.equal(tweet.recipient.toString(), otherUser.publicKey.toString());
		// console.log('tweet sent to another user', tweet)
	});

	it("can fetch all tweets", async () => {
		const tweets = await program.account.tweet.all();
		assert.equal(tweets.length, 4);
	});

	it("can filter tweets by user", async () => {
		const userPublicKey = programProvider.wallet.publicKey;
		const tweets = await program.account.tweet.all([
			{
				memcmp: {
					offset: 8, // Discrimminator
					bytes: userPublicKey.toBase58(),
				},
			},
		]);

		// Check if the fetched amout of tweets is equal to those the user sent
		assert.equal(tweets.length, 3);
		assert.ok(
			tweets.every((tweet) => {
				return (
					tweet.account.user.toBase58() === userPublicKey.toBase58()
				);
			})
		);
		// console.log('Tweets filtered by user: ', tweets);
	});

	it("can filter tweets by recepient", async () => {
		const tweets = await program.account.tweet.all([
			{
				memcmp: {
					offset:
						8 + // Discriminator.
						32, // User public key.
					bytes: otherUser.publicKey.toBase58(),
				},
			},
		]);

		assert.ok(
			tweets.every((tweet) => {
				return tweet.account.recipient.toBase58() == otherUser.publicKey.toBase58();
			})
		);
		// console.log('Tweets filtered by dm: ', tweets);
	});

	it("can filter tweets by tags", async () => {
		const tweets = await program.account.tweet.all([
			{
				memcmp: {
					offset:
						8 + // Discriminator.
						32 + // User public key.
						32 + // Recepient public key.
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

	// Tweet 5
	it("can update a tweet", async () => {
		const tweetKeypair = anchor.web3.Keypair.generate();
		// Use the sendTweet function to call the "SendTweet" instruction
		await sendTweet(tweetKeypair, userOne, "web3", "takes over!", null);
		// Fetch its details
		const tweet = await program.account.tweet.fetch(tweetKeypair.publicKey);

		// Check if it was received correctly
		assert.equal(tweet.tag, "web3");
		assert.equal(tweet.content, "takes over!");
		assert.equal(tweet.edited, false);

		// Update the tweet
		await program.rpc.updateTweet("baneyneys", "And lobsters!", {
			accounts: {
				tweet: tweetKeypair.publicKey,
				user: userOne.publicKey
			},
		});

		// Check if the tweet was updated
		const updatedTweet = await program.account.tweet.fetch(
			tweetKeypair.publicKey
		);
		assert.equal(updatedTweet.tag, "baneyneys");
		assert.equal(updatedTweet.content, "And lobsters!");
		assert.equal(updatedTweet.edited, true);
	});

	// Tweet 6
	it("cannot update a tweet that wasn't changed", async () => {
		try {
			const tweetKeypair = anchor.web3.Keypair.generate();
			await sendTweet(tweetKeypair, userOne, "web3", "takes over!", null);
			const tweet = await program.account.tweet.fetch(tweetKeypair.publicKey);

			// Check if it was received correctly
			assert.equal(tweet.tag, "web3");
			assert.equal(tweet.content, "takes over!");
			assert.equal(tweet.edited, false);

			await program.rpc.updateTweet("web3", "takes over!", {
				accounts: {
					tweet: tweetKeypair.publicKey,
					user: userOne.publicKey
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

	// Tweet 7
	it("can upvote a tweet", async () => {
		const goodTweetKeypair = anchor.web3.Keypair.generate();
		await sendTweet(goodTweetKeypair, userOne, "web3", "takes over", null);
		const goodTweet = await program.account.tweet.fetch(goodTweetKeypair.publicKey);

		// Check that the tweet has no rating yet
		assert.ok(goodTweet.rating == 0);

		// Upvote the tweet
		await program.rpc.upvoteTweet({
			accounts: {
				tweet: goodTweetKeypair.publicKey,
			},
		});

		// Check if the tweet was upvoted
		const upvotedTweet = await program.account.tweet.fetch(
			goodTweetKeypair.publicKey
		);

		assert.ok(upvotedTweet.rating == 1);
		// console.log("Rating: ", upvotedTweet.rating);
	});

	// Define on global scope so it can be downvoted multiple times
	let badTweetKeypair = anchor.web3.Keypair.generate();

	// Tweet 8
	it("can downvote a tweet", async () => {
		// Airdrop some SOL
		const signature = await programProvider.connection.requestAirdrop(
			confusedUser.publicKey,
			1000000000
		);
		await programProvider.connection.confirmTransaction(signature);

		await sendTweet(badTweetKeypair, confusedUser, "hejustwantsourbest", "i like bill gates", null
		);
		const badTweet = await program.account.tweet.fetch(
			badTweetKeypair.publicKey
		);

		// Check that the tweet has no rating yet
		assert.ok(badTweet.rating == 0);

		// Downvote that tweet
		await program.rpc.downvoteTweet({
			accounts: {
				tweet: badTweetKeypair.publicKey,
			},
		});

		// Check if the tweet was downvoted
		const downvotedTweet = await program.account.tweet.fetch(
			badTweetKeypair.publicKey
		);

		assert.ok(downvotedTweet.rating == -1);
		// console.log("Rating: ", downvotedTweet.rating);
	});

	it("can downvote a tweet again", async () => {
		const badTweet = await program.account.tweet.fetch(
			badTweetKeypair.publicKey
		);
		// Check that the tweet was downvoted already
		assert.ok(badTweet.rating == -1);

		// Downvote the tweet again
		await program.rpc.downvoteTweet({
			accounts: {
				tweet: badTweetKeypair.publicKey,
			},
		});

		// Check if the tweet was downvoted again
		const downvotedTweet = await program.account.tweet.fetch(
			badTweetKeypair.publicKey
		);

		assert.ok(downvotedTweet.rating == -2);
		// console.log("Rating: ", downvotedTweet.rating);
	});
});
