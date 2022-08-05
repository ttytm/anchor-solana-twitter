use anchor_lang::prelude::*;

#[account]
pub struct Reaction {
	pub user: Pubkey,
	pub tweet: Pubkey,
	pub reaction_char: ReactionChar,
	pub bump: u8,
}

#[derive(Accounts)]
#[instruction(tweet: Pubkey)]
pub struct React<'info> {
	#[account(init, 
        payer = user, 
        // 8 discriminator + 32 user + 32 tweet + 8 timestamp + 1 ReactionChar enum + 1 bump
        space = 8 + 32 + 32 + 1 + 1, 
        seeds = [b"reaction", user.key().as_ref(), tweet.key().as_ref()], 
        bump)]
	pub reaction: Account<'info, Reaction>,
	pub system_program: Program<'info, System>,
	#[account(mut)]
	pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateReaction<'info> {
	pub user: Signer<'info>,
	#[account(mut,
        seeds = [b"reaction", user.key().as_ref(), reaction.tweet.key().as_ref()], 
        bump = reaction.bump)]
	pub reaction: Account<'info, Reaction>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, PartialOrd)]
pub enum ReactionChar {
	ThumbsUp,
	Party,
	Haha,
	Wow,
	Rocket,
	Eyes,
	Invalid,
}
