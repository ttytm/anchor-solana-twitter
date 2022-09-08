import * as assert from "assert";
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { program, user, createUsers } from "../tests";
import { sendTweet } from "../tests/1-tweets";

const vote = async (user: any, tweet: PublicKey, result: {}) => {
	const [votingPDA, bump] = await PublicKey.findProgramAddress([
		anchor.utils.bytes.utf8.encode("voting"),
		user.publicKey.toBuffer(),
		tweet.toBuffer(),
	], program.programId);

	await program.methods.vote(tweet, result, bump)
		.accounts({ user: user.publicKey, voting: votingPDA })
		.signers(user instanceof (anchor.Wallet as any) ? [] : [user])
		.rpc();

	const voting = await program.account.voting.fetch(votingPDA);
	return { pda: votingPDA, account: voting }
}

describe("votings", () => {
	it("can vote and update a voting", async () => {
		const [otherUser] = await createUsers(2)
		const tweet = await sendTweet(otherUser, "linux", "Don't forget about the GNU 🦬");

		const voting = await vote(user, tweet.publicKey, { dislike: {} })
		assert.equal(voting.account.tweet.toString(), tweet.publicKey.toString());
		assert.deepEqual(voting.account.result, { dislike: {} });

		// Update voting
		await program.methods.updateVoting({ like: {} })
			.accounts({ user: user.publicKey, voting: voting.pda })
			.rpc();
		const updatedVoting = await program.account.voting.fetch(voting.pda);
		assert.deepEqual(updatedVoting.result, { like: {} });

		// A user votes for tweet that another user has already voted for
		const otherUsersVoting = await vote(otherUser, tweet.publicKey, { dislike: {} })
		assert.equal(otherUsersVoting.account.tweet.toString(), tweet.publicKey.toString());
		assert.deepEqual(otherUsersVoting.account.result, { dislike: {} });
	});

	it("can derive tweets from votings", async () => {
		const userVotings = await program.account.voting.all([
			// offset: 8 Discriminator
			{ memcmp: { offset: 8, bytes: user.publicKey.toBase58() } }
		]);
		assert.equal(userVotings.length, 1);
		assert.ok(userVotings.every((voting) => voting.account.user.toBase58() === user.publicKey.toBase58()));

		// Filter liked tweets
		const likedTweets = await Promise.all(userVotings
			.filter((voting) => Object.keys(voting.account.result).toString() == 'like')
			.map((voting) => (program.account.tweet.fetch(voting.account.tweet)))
		);
		assert.equal(likedTweets.length, 1);
		assert.equal(likedTweets[0].tag, "linux");
	});
})

