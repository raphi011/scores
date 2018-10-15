import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
import { createStyles, Theme, withStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import React from 'react';

const styles = (theme: Theme) =>
  createStyles({
    close: {
      width: theme.spacing.unit * 4,
      height: theme.spacing.unit * 4,
    },
  });

const handleRequestClose = onClose => (_, reason) => {
  if (reason === 'clickaway') {
    return;
  }

  onClose();
};

interface Props {
  onClose: () => void;
  status: string;
  open: boolean;
  classes: any;
}

const SimpleSnackbar = ({ classes, onClose, status, open }: Props) => (
  <Snackbar
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}
    open={open}
    autoHideDuration={6000}
    onClose={handleRequestClose(onClose)}
    message={<span id="message-id">{status}</span>}
    action={[
      <IconButton
        key="close"
        aria-label="Close"
        color="inherit"
        className={classes.close}
        onClick={onClose}
      >
        <CloseIcon />
      </IconButton>,
    ]}
  />
);

export default withStyles(styles)(SimpleSnackbar);
