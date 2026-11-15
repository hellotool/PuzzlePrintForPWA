import LightbulbOutlinedIcon from '@suid/icons-material/LightbulbOutlined';
import PaletteOutlinedIcon from '@suid/icons-material/PaletteOutlined';
import AddIcon from '@suid/icons-material/Add';
import CloseIcon from '@suid/icons-material/Close';
import RemoveIcon from '@suid/icons-material/Remove';
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from '@suid/material';
import type { SelectChangeEvent } from '@suid/material/Select';
import type { DataType } from 'csstype';
import { For, Show, type JSX } from 'solid-js';
import { getAvailablePageSizes } from '@/features/print';
import ListSwitchItem from '@/shared/components/list/ListSwitchItem';
import ToolbarTitle from '@/shared/components/toolbar/ToolbarTitle';
import { usePreferredDarkMode } from '@/shared/hooks/usePreferredDarkMode';
import { useConfig } from '../contexts/ConfigContext';
import type { PrintConfig } from '../types/config';
import CustomMarginItems from './AdjustSheets/CustomMarginItems';

function SettingListItem(props: { label: string; hint?: string; children: JSX.Element }) {
  return (
    <ListItem sx={{ gap: 1 }}>
      <ListItemText
        primary={props.label}
        secondary={props.hint}
        sx={{
          minWidth: 0,
          paddingRight: 1,
        }}
      />
      <Box sx={{ flexShrink: 0 }}>{props.children}</Box>
    </ListItem>
  );
}

function Stepper(props: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <IconButton
        size="small"
        aria-label={`${props.label}减一`}
        disabled={props.value <= 1}
        onClick={() => props.onChange(props.value - 1)}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
        {props.value}
      </Typography>
      <IconButton size="small" aria-label={`${props.label}加一`} onClick={() => props.onChange(props.value + 1)}>
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

interface SettingsPanelProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function SettingsPanel(props: SettingsPanelProps) {
  const { state: config, actions: configActions } = useConfig();
  const isPreferredDark = usePreferredDarkMode();

  function handlePageSizeChange(event: SelectChangeEvent<DataType.PageSize | 'custom'>) {
    if (event.target.value !== 'custom') {
      configActions.print.setPaperSize(event.target.value);
    }
  }

  function handleOrientationChange(_event: unknown, value: unknown) {
    if (value === 'portrait' || value === 'landscape') {
      configActions.print.setOrientation(value);
    }
  }

  function handleMarginPresetChange(event: SelectChangeEvent<PrintConfig['contentMarginPreset']>) {
    configActions.print.setMarginPreset(event.target.value);
  }

  function handleGrayToggle() {
    configActions.preview.setColorMode(config.preview.colorMode === 'gray' ? 'colorful' : 'gray');
  }

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Toolbar variant="dense" sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}>
        <ToolbarTitle>选项</ToolbarTitle>
        <Show when={props.onClose && (props.showCloseButton ?? true)}>
          <IconButton size="small" aria-label="关闭选项面板" onClick={props.onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Show>
      </Toolbar>

      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <List>
          <ListSubheader>版面</ListSubheader>
          <SettingListItem label="列数">
            <Stepper
              label="列数"
              value={config.layout.columns}
              onChange={(value) => configActions.layout.setColumns(Math.max(1, value))}
            />
          </SettingListItem>
          <SettingListItem label="行数">
            <Stepper
              label="行数"
              value={config.layout.rows}
              onChange={(value) => configActions.layout.setRows(Math.max(1, value))}
            />
          </SettingListItem>
        </List>

        <Divider />

        <List>
          <ListSubheader>纸张</ListSubheader>
          <SettingListItem label="纸张尺寸">
            <FormControl size="small" sx={{ minWidth: 136 }}>
              <Select
                value={typeof config.print.size === 'string' ? config.print.size : 'custom'}
                onChange={handlePageSizeChange}
                inputProps={{ 'aria-label': '纸张尺寸' }}
              >
                <For each={getAvailablePageSizes()}>{(size) => <MenuItem value={size}>{size}</MenuItem>}</For>
                <MenuItem value="custom" disabled>
                  自定义
                </MenuItem>
              </Select>
            </FormControl>
          </SettingListItem>
          <SettingListItem label="方向">
            <ToggleButtonGroup
              exclusive
              size="small"
              value={config.print.orientation}
              onChange={handleOrientationChange}
              aria-label="纸张方向"
            >
              <ToggleButton value="portrait">纵向</ToggleButton>
              <ToggleButton value="landscape">横向</ToggleButton>
            </ToggleButtonGroup>
          </SettingListItem>
          <SettingListItem label="页边距">
            <FormControl size="small" sx={{ minWidth: 112 }}>
              <Select
                value={config.print.contentMarginPreset}
                onChange={handleMarginPresetChange}
                inputProps={{ 'aria-label': '页边距' }}
              >
                <MenuItem value="default">默认</MenuItem>
                <MenuItem value="custom">自定义</MenuItem>
              </Select>
            </FormControl>
          </SettingListItem>
          <Show when={config.print.contentMarginPreset === 'custom'}>
            <CustomMarginItems />
            <ListItem>
              <ListItemText secondary="自定义边距" />
              <Button size="small" onClick={() => configActions.print.resetMargins()}>
                恢复默认
              </Button>
            </ListItem>
          </Show>
        </List>

        <Divider />

        <List>
          <ListSubheader>打印</ListSubheader>
          <ListSwitchItem
            checked={config.print.compatibility}
            onClick={() => configActions.print.toggleCompatibility()}
            title="兼容打印"
            summary={
              config.print.compatibility
                ? '由应用绘制页边距与页码，输出与预览一致'
                : '由浏览器绘制边距与页脚，请在打印对话框中设置'
            }
          />
          <ListSwitchItem
            checked={config.numbering.imageEnabled}
            onClick={() => configActions.numbering.toggleImage()}
            title="图片序号"
            summary="在每张图片左下角显示序号"
          />
          <ListSwitchItem
            checked={config.numbering.pageEnabled}
            disabled={!config.print.compatibility}
            onClick={() => configActions.numbering.togglePage()}
            title="页码"
            summary={
              config.print.compatibility
                ? '在纸张页脚显示「当前页 / 总页数」'
                : '仅在兼容打印开启时生效，当前由浏览器绘制页码'
            }
          />
        </List>

        <Divider />

        <List>
          <ListSubheader>预览</ListSubheader>
          <ListSwitchItem
            checked={config.preview.colorMode === 'gray'}
            icon={<PaletteOutlinedIcon />}
            onClick={handleGrayToggle}
            title="灰度预览"
            summary="仅影响屏幕显示，不影响打印"
          />
          <Show when={isPreferredDark()}>
            <ListSwitchItem
              checked={config.preview.lightMode}
              icon={<LightbulbOutlinedIcon />}
              onClick={() => configActions.preview.toggleLightMode()}
              title="亮色预览"
            />
          </Show>
        </List>
      </Box>
    </Box>
  );
}
