import * as assert from "assert";
import { program, user, sendTweet, sendComment } from "../tests";

describe("comments", () => {
	it("can comment and update comments", async () => {
		const tweet = await sendTweet(user, "comment", "on me!");

		// Send comment
		const tweetComment = await sendComment({ user, tweetParent: tweet.publicKey, content: "🍗", directParent: null });
		assert.equal(tweetComment.account.tweet.toBase58(), tweet.publicKey.toBase58());

		// Update comment
		await program.methods.updateComment("🍠")
			.accounts({ comment: tweetComment.publicKey, user: user.publicKey })
			.rpc();
		const updatedTweetComment = await program.account.comment.fetch(tweetComment.publicKey);
		assert.equal(updatedTweetComment.content, "🍠");
		assert.deepEqual(updatedTweetComment.state, { edited: {} });

		// Comment on a comment
		const commentComment = await sendComment({ user, tweetParent: tweet.publicKey, content: "😍", directParent: tweetComment.publicKey });
		assert.equal(commentComment.account.tweet.toBase58(), tweet.publicKey.toBase58());
		assert.equal(commentComment.account.parent.toBase58(), tweetComment.publicKey.toBase58());
	});

	it("can delete comments", async () => {
		const tweet = await sendTweet(user, "comment", "on me!");

		// Send comment
		const tweetComment = await sendComment({ user, tweetParent: tweet.publicKey, content: "whoops", directParent: null });
		assert.equal(tweetComment.account.tweet.toBase58(), tweet.publicKey.toBase58());

		// Delete comment 
		await program.methods.deleteComment()
			.accounts({ comment: tweetComment.publicKey, user: user.publicKey })
			.rpc();

		const deletedComment = await program.account.comment.fetch(tweetComment.publicKey);
		assert.equal(deletedComment.content, "");
		assert.deepEqual(deletedComment.state, { deleted: {} });
	});
});


