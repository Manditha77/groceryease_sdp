import React from 'react';
import { Card, CardContent, Box, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';

const ProductSkeleton: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                <Skeleton
                    variant="rectangular"
                    width="100%"
                    sx={{
                        height: 0,
                        paddingTop: '75%',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8
                    }}
                />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Skeleton variant="rectangular" width={80} height={20} sx={{ mb: 1, borderRadius: 4 }} />
                    <Skeleton variant="text" width="80%" height={28} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
                    <Skeleton variant="rectangular" width={120} height={20} sx={{ mb: 2 }} />

                    <Box sx={{ mt: 'auto' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Skeleton variant="text" width={80} height={32} />
                            <Skeleton variant="text" width={60} height={20} />
                        </Box>
                        <Skeleton variant="rectangular" height={40} width="100%" sx={{ borderRadius: 8 }} />
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ProductSkeleton;