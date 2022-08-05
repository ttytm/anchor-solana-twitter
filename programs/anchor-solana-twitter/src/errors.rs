use anchor_lang::error_code;

#[error_code]
pub enum ErrorCode {
	#[msg("Exceeding maximum number of allowed characters")]
	TooLong,
	#[msg("Trying to send unallowed characters")]
	UnallowedChars,
	#[msg("Trying to send a tweet without content")]
	NoContent,
	#[msg("No changes detected. Nothing that could be updated")]
	NothingChanged,
	#[msg("An alias for this user is already registered")]
	AliasPresent,
}
