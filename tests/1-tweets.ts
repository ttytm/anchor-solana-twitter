import * as assert from "assert";
import * as bs58 from "bs58";
import { provider, program, user, sendTweet, createUser } from "../tests";

describe("tweets", () => {
	it("can send and update tweets", async () => {
		// Send tweet #1
		const tweet = await sendTweet(user, "veganism", "Hummus, am i right 🧆?");
		// Ensure it has the right data
		assert.equal(tweet.account.user.toBase58(), user.publicKey.toBase58());
		assert.equal(tweet.account.tag, "veganism");
		assert.equal(tweet.account.content, "Hummus, am i right 🧆?");
		assert.ok(tweet.account.timestamp);

		const otherUser = await createUser();

		// Send tweet #2
		const tweetTwo = await sendTweet(otherUser, "veganism", "Yay Tofu 🍜!");
		assert.equal(tweetTwo.account.user.toBase58(), otherUser.publicKey.toBase58());
		assert.equal(tweetTwo.account.tag, "veganism");
		assert.equal(tweetTwo.account.content, "Yay Tofu 🍜!");
		assert.ok(tweetTwo.account.timestamp);

		// Update tweet #2
		await program.methods.updateTweet("baneyneys", "Freshavacados!")
			.accounts({ tweet: tweetTwo.publicKey, user: otherUser.publicKey })
			.signers([otherUser])
			.rpc();

		// Fetch updated tweets state to check if it has the right data
		const updatedTweet = await program.account.tweet.fetch(tweetTwo.publicKey);
		assert.equal(updatedTweet.tag, "baneyneys");
		assert.equal(updatedTweet.content, "Freshavacados!");
		assert.deepEqual(updatedTweet.state, { edited: {} });
	});

	it("can send a tweet without a tag", async () => {
		// Send tweet #3 (#2 by userOne)
		const tweet = await sendTweet(user, "", "gm");
		assert.equal(tweet.account.user.toBase58(), provider.wallet.publicKey.toBase58());
		assert.equal(tweet.account.tag, "[untagged]");
		assert.equal(tweet.account.content, "gm");
		assert.ok(tweet.account.timestamp);
	});

	it("cannot send a tweet without content", async () => {
		try {
			await sendTweet(user, "gm", "");
		} catch (err) {
			assert.equal(err.error.errorCode.code, "NoContent");
		}
	});

	it("cannot send a tweet with a tag > 50 or content > 280 characters", async () => {
		try {
			const tagWith51Chars = "x".repeat(51);
			await sendTweet(user, tagWith51Chars, "takes over!");
		} catch (err) {
			assert.equal(err.error.errorCode.code, "TooLong");
		}
		try {
			const contentWith281Chars = "x".repeat(281);
			await sendTweet(user, "veganism", contentWith281Chars);
		} catch (err) {
			assert.equal(err.error.errorCode.code, "TooLong");
		}
	});

	it("cannot update a tweet without changes", async () => {
		// Send tweet #5 (#3 by userOne)
		const tweet = await sendTweet(user, "web3", "takes over!");
		assert.equal(tweet.account.tag, "web3");
		assert.equal(tweet.account.content, "takes over!");
		assert.equal(tweet.account.state, null);

		// Try to update tweet with same topic and content
		try {
			await program.methods.updateTweet("web3", "takes over!")
				.accounts({ tweet: tweet.publicKey, user: user.publicKey })
				.rpc();
		} catch (err) {
			assert.equal(err.error.errorCode.code, "NothingChanged");
			return;
		}
		assert.fail("The instruction should have failed with a tweet without changes.");
	});

	it("can delete own tweets", async () => {
		// Send tweet #6 (#4 by userOne)
		const tweetToDelete = await sendTweet(user, "gm", "Can I delete this?");

		await program.methods.deleteTweet()
			.accounts({ tweet: tweetToDelete.publicKey, user: user.publicKey })
			.rpc();
		const deletedTweet = await program.account.tweet.fetch(tweetToDelete.publicKey);
		assert.equal(deletedTweet.tag, "[deleted]");
		assert.equal(deletedTweet.content, "");

		// Try to delete other users tweet
		const otherUser = await createUser();
		// Send tweet #4
		const tweet = await sendTweet(otherUser, "solana", "gm");
		try {
			await program.methods.deleteTweet()
				.accounts({ tweet: tweet.publicKey, user: user.publicKey })
				.rpc();
			assert.fail("We shouldn't be able to delete someone else's tweet but did.");
		} catch (error) {
			// Check if tweet account still exists with the right data
			const tweetState = await program.account.tweet.fetch(tweet.publicKey);
			assert.equal(tweetState.tag, "solana");
			assert.equal(tweetState.content, "gm");
		}
	});

	it("can fetch and filter tweets", async () => {
		const allTweets = await program.account.tweet.all();
		assert.equal(allTweets.length, 6);

		const userTweets = await program.account.tweet.all([
			// offset: 8 Discriminator
			{ memcmp: { offset: 8, bytes: user.publicKey.toBase58() } },
		]);
		// Check if the fetched amount of tweets is equal to those the use sent
		assert.equal(userTweets.length, 4);
		assert.ok(userTweets.every((tweet) => tweet.account.user.toBase58() === user.publicKey.toBase58()));

		const tagTweets = await program.account.tweet.all([
			// offset: 8 Discriminator + 32 User public key + 8 Timestamp + 4 Tag string prefix
			{ memcmp: { offset: 8 + 32 + 8 + 4, bytes: bs58.encode(Buffer.from("veganism")) } },
		]);
		assert.equal(tagTweets.length, 1);
		assert.ok(tagTweets.every((tweetAccount) => tweetAccount.account.tag === "veganism"));
	});
});

