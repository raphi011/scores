package sql

import (
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"

	"github.com/raphi011/scores-api"
	"github.com/raphi011/scores-api/repo"
	"github.com/raphi011/scores-api/repo/sql/crud"
)

var _ repo.SettingRepository = &settingRepository{}

type settingRepository struct {
	DB *sqlx.DB
}

func (s *settingRepository) Create(setting *scores.Setting) (*scores.Setting, error) {
	err := crud.Create(s.DB, "setting/insert", setting)

	return setting, errors.Wrap(err, "insert setting")
}

func (s *settingRepository) Update(setting *scores.Setting) error {
	err := crud.Update(s.DB, "setting/update", setting)

	return errors.Wrap(err, "update setting")
}

func (s *settingRepository) ByUserID(userID uuid.UUID) ([]*scores.Setting, error) {
	settings := []*scores.Setting{}
	err := crud.Read(s.DB, "setting/select-by-user-id", &settings, userID)

	return settings, errors.Wrap(err, "byUserID setting")

}
