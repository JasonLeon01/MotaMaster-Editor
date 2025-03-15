import { Alert, Snackbar } from "@mui/material";

interface HintProps {
  snackbar: {
    open: boolean;
    severity: 'success' | 'info' | 'warning' | 'error';
    message: string;
  };
  handleOnClose: () => void;
}

const Hint: React.FC<HintProps> = ({ snackbar, handleOnClose }) => {
    return (
        <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={ handleOnClose }
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
        <Alert severity={snackbar.severity} onClose={ handleOnClose }>
            {snackbar.message}
        </Alert>
    </Snackbar>

    );
}
export default Hint;