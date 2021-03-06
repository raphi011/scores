INSERT INTO users (
    id,
    created_at,
    email,
    profile_image_url,
    player_id,
    player_login,    
    role,
    pw_salt,
    pw_hash,
    pw_iterations
)
VALUES (
    :id,
    :created_at,
    :email,
    :profile_image_url,
    NULLIF(:player_id, 0),
    :player_login,
    :role,
    :pw_salt,
    :pw_hash,
    :pw_iterations
)