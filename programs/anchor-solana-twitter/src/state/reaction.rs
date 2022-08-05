use anchor_lang::prelude::*;
use anchor_lang::AnchorSerialize;

#[account]
pub struct Reaction {
	pub user: Pubkey,
	pub tweet: Pubkey,
	pub reaction_char: String, // it doesn't seem that we can use char here
	pub bump: u8,
}

#[derive(Accounts)]
#[instruction(tweet: Pubkey)]
pub struct React<'info> {
	#[account(init, 
        payer = user, 
        // 8 discriminator + 32 user + 32 tweet + 8 timestamp + 4 string prefix + 4 utf8 char + 1 bump
        space = 8 + 32 + 32 + 4 + 4 + 1, 
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
