import { boot } from 'quasar/wrappers';
import * as ECharts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Registreer de benodigde ECharts componenten
ECharts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  BarChart,
  CanvasRenderer,
]);

export default boot(({ app }) => {
  // ECharts is nu beschikbaar in de hele app
  console.log('ECharts boot file loaded');
});
