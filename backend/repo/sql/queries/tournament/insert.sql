INSERT INTO volleynet_tournaments
(
	id,
	created_at,
	updated_at,
	gender,
	start,
	end,
	name,
	league,
	link,
	entry_link,
	status,
	registration_open,
	location,
	html_notes,
	mode,
	max_points,
	min_teams,
	max_teams,
	end_registration,
	organiser,
	phone,
	email,
	web,
	current_points,
	live_scoring_link,
	loc_lat,
	loc_lon,
	season,
	signedup_teams
)
VALUES
(
	?,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?,
	?
)