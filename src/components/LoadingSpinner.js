import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
    message?: string;
    size?: number;
    fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
                                                           message = 'Loading...',
                                                           size = 40,
                                                           fullScreen = false,
                                                       }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: fullScreen ? '100vh' : '200px',
                width: '100%',
            }}
        >
            <CircularProgress size={size} thickness={4} sx={{ color: '#0478C0' }} />
            <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                {message}
            </Typography>
        </Box>
    );
};

export default LoadingSpinner;