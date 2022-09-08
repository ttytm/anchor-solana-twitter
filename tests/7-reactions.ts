import * as assert from "assert";
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { program, user } from "../tests";
import { sendTweet } from "../tests/1-tweets";

describe("reactions", () => {
	it("can react on tweets and update and delete reactions", async () => {
		const tweet = await sendTweet(user, "linux", "Don't forget about the GNU 🦬");

		const [reactionPDA, bump] = await PublicKey.findProgramAddress([
			anchor.utils.bytes.utf8.encode("reaction"),
			user.publicKey.toBuffer(),
			tweet.publicKey.toBuffer(),
		], program.programId);

		await program.methods.react(tweet.publicKey, "🚀", bump)
			.accounts({ user: user.publicKey, reaction: reactionPDA })
			.rpc();

		const reaction = await program.account.reaction.fetch(reactionPDA);

		assert.equal(reaction.tweet.toString(), tweet.publicKey.toString());
		assert.deepEqual(reaction.reactionChar, { rocket: {} });

		// Update reaction
		await program.methods.updateReaction("👀")
			.accounts({ user: user.publicKey, reaction: reactionPDA })
			.rpc();
		const updatedReaction = await program.account.reaction.fetch(reactionPDA);
		assert.deepEqual(updatedReaction.reactionChar, { eyes: {} });

		await program.methods.deleteReaction()
			.accounts({ user: user.publicKey, reaction: reactionPDA })
			.rpc();
		assert.ok((await program.account.reaction.fetchNullable(reactionPDA)) === null);
	})

	it("cannot send other then predefined reactions", async () => {
		const tweet = await sendTweet(user, "linux", "Don't forget about the GNU 🦬");

		const [reactionPDA, bump] = await PublicKey.findProgramAddress([
			anchor.utils.bytes.utf8.encode("reaction"),
			user.publicKey.toBuffer(),
			tweet.publicKey.toBuffer(),
		], program.programId);

		try {
			await program.methods.react(tweet.publicKey, "💩", bump)
				.accounts({ user: user.publicKey, reaction: reactionPDA })
				.rpc();
		} catch (err) {
			assert.equal(err.error.errorCode.code, "UnallowedChars");
		}
	});
});

