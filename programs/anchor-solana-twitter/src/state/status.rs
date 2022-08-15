use anchor_lang::prelude::*;

#[account]
pub struct Status {
	pub message: String,
	pub bump: u8,
}

#[derive(Accounts)]
pub struct CreateStatus<'info> {
	// space: 8 discriminator + (4 length prefix + 50 * 4 ) status + 1 bump
	#[account(init, payer = user, space = 8 + (4 + 50 * 4) + 1, seeds = [b"status", user.key().as_ref()], bump)]
	pub status: Account<'info, Status>,
	pub system_program: Program<'info, System>,
	#[account(mut)]
	pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateStatus<'info> {
	pub user: Signer<'info>,
	#[account(mut, seeds = [b"status", user.key().as_ref()], bump = status.bump)]
	pub status: Account<'info, Status>,
}

#[derive(Accounts)]
pub struct DeleteStatus<'info> {
	pub user: Signer<'info>,
	#[account(mut, close = user, seeds = [b"status", user.key().as_ref()], bump = status.bump)]
	pub status: Account<'info, Status>,
}
