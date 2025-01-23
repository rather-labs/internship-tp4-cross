# Last commit

- Fix setting of "FINISHED"
- Fix tooltip positioning, always on top and to the left of the question mark
- Fix updating of oracle button when chain data changes
- Add logic for ZK proof usage for the first player move
-

# TODO

- Add ZK proof for the first player move (who starts the game) and verify it on game contract
  before responding
  - when the first player receives the move, it respnods by sending a new message with
    the play and nonce that was used to hash the play
