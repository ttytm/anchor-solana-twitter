use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solana_twitter {
    use super::*;
    pub fn send_tweet(ctx: Context<SendTweet>, tag: String, content: String) -> Result<()> {
        let tweet = &mut ctx.accounts.tweet;
        let user: &Signer = &ctx.accounts.user;
        let clock: Clock = Clock::get().unwrap();

        require!(tag.chars().count() <= 50, ErrorCode::TopicTooLong);

        require!(content.chars().count() <= 280, ErrorCode::ContentTooLong);

        tweet.user = *user.key;
        tweet.timestamp = clock.unix_timestamp;
        tweet.tag = tag;
        tweet.content = content;
        tweet.edited = false;
        tweet.rating = 0;

        Ok(())
    }

    pub fn update_tweet(ctx: Context<UpdateTweet>, tag: String, content: String) -> Result<()> {
        let tweet = &mut ctx.accounts.tweet;
        let current_tag = &tweet.tag;
        let current_content = &tweet.content;

        if current_tag == &tag && current_content == &content {
            return Err(error!(ErrorCode::NothingToUpdate));
        }

        if tag.chars().count() > 50 {
            return Err(error!(ErrorCode::TopicTooLong));
        }

        if content.chars().count() > 280 {
            return Err(error!(ErrorCode::ContentTooLong));
        }

        tweet.tag = tag;
        tweet.content = content;
        tweet.edited = true;

        Ok(())
    }

    pub fn upvote_tweet(ctx: Context<UpvoteTweet>) -> Result<()> {
        let tweet = &mut ctx.accounts.tweet;

        if tweet.rating == 127 {
            return Err(error!(ErrorCode::RatingAtMax));
        }

        tweet.rating += 1;

        Ok(())
    }

    pub fn downvote_tweet(ctx: Context<DownvoteTweet>) -> Result<()> {
        let tweet = &mut ctx.accounts.tweet;

        if tweet.rating == -128 {
            return Err(error!(ErrorCode::RatingAtMin));
        }

        tweet.rating -= 1;

        Ok(())
    }

    pub fn delete_tweet(_ctx: Context<DeleteTweet>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SendTweet<'info> {
    #[account(init, payer = user, space = Tweet::LEN)]
    pub tweet: Account<'info, Tweet>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateTweet<'info> {
    #[account(mut, has_one = user)]
    pub tweet: Account<'info, Tweet>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpvoteTweet<'info> {
    #[account(mut)]
    pub tweet: Account<'info, Tweet>,
}

#[derive(Accounts)]
pub struct DownvoteTweet<'info> {
    #[account(mut)]
    pub tweet: Account<'info, Tweet>,
}

#[derive(Accounts)]
pub struct DeleteTweet<'info> {
    #[account(mut, has_one = user, close = user)]
    pub tweet: Account<'info, Tweet>,
    pub user: Signer<'info>,
}

#[account]
pub struct Tweet {
    pub user: Pubkey,
    pub timestamp: i64,
    pub tag: String,
    pub content: String,
    pub rating: i8,
    pub edited: bool,
}

// 2. Add some useful constants for sizing propeties.
const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores size of the string
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars max
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280  chars max
const EDITED_LENGTH: usize = 1;
const RATING_LENGTH: usize = 1;

// 3. Add a constant on the Tweet account that provides its total size.
impl Tweet {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // user
        + TIMESTAMP_LENGTH
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH
        + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH
        + EDITED_LENGTH
        + RATING_LENGTH;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Exceeding maximum tag length of 50 characters.")]
    TopicTooLong,
    #[msg("Exceeding maximum content length of 280 characters.")]
    ContentTooLong,
    #[msg("Nothing that could be updated.")]
    NothingToUpdate,
    #[msg("The maximum rating is already reached.")]
    RatingAtMax,
    #[msg("The mininum rating is already reached.")]
    RatingAtMin,
}
