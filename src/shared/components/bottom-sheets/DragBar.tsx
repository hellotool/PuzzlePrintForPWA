import { Box } from '@suid/material';
import { styled, type Theme } from '@suid/material/styles';
import { SxProps } from '@suid/system';

const DragIcon = styled('div')(({ theme }) => ({
  width: 30,
  height: 6,
  backgroundColor: theme.palette.divider,
  borderRadius: 3,
}));

interface BottomSheetsDragBarProps {
  sx?: SxProps<Theme>;
}

export default function BottomSheetsDragBar(props: BottomSheetsDragBarProps) {
  return (
    <Box
      sx={[
        {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 32,
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      <DragIcon />
    </Box>
  );
}
