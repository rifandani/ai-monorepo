'use client';

import type { ComponentProps } from 'react';
import type { LineProps } from 'recharts';
import { Line, LineChart as LineChartPrimitive } from 'recharts';
import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import { twMerge } from 'tailwind-merge';
import type { BaseChartProps } from './chart';
import {
  CartesianGrid,
  Chart,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  constructCategoryColors,
  DEFAULT_COLORS,
  getColorValue,
  valueToPercent,
  XAxis,
  YAxis,
} from './chart';

interface LineChartProps<TValue extends ValueType, TName extends NameType>
  extends BaseChartProps<TValue, TName> {
  connectNulls?: boolean;
  lineProps?: LineProps;
  chartProps?: Omit<
    ComponentProps<typeof LineChartPrimitive>,
    'data' | 'stackOffset'
  >;
}

export function LineChart<TValue extends ValueType, TName extends NameType>({
  data = [],
  dataKey,
  colors = DEFAULT_COLORS,
  connectNulls = false,
  type = 'default',
  className,
  config,
  children,

  // Components
  tooltip = true,
  tooltipProps,

  legend = true,
  legendProps,

  intervalType = 'equidistantPreserveStart',

  valueFormatter = (value: number) => value.toString(),

  // XAxis
  displayEdgeLabelsOnly = false,
  xAxisProps,
  hideXAxis = false,

  // YAxis
  yAxisProps,
  hideYAxis = false,

  hideGridLines = false,
  chartProps,
  lineProps,
  ...props
}: LineChartProps<TValue, TName>) {
  const categoryColors = constructCategoryColors(Object.keys(config), colors);

  return (
    <Chart
      className={twMerge('h-80 w-full', className)}
      config={config}
      data={data}
      dataKey={dataKey}
      {...props}
    >
      {({ onLegendSelect, selectedLegend }) => (
        <LineChartPrimitive
          data={data}
          margin={{
            bottom: 0,
            left: 0,
            right: 0,
            top: 5,
          }}
          onClick={() => {
            onLegendSelect(null);
          }}
          stackOffset={type === 'percent' ? 'expand' : undefined}
          {...chartProps}
        >
          {!hideGridLines && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            className="**:[text]:fill-muted-fg"
            displayEdgeLabelsOnly={displayEdgeLabelsOnly}
            hide={hideXAxis}
            intervalType={intervalType}
            {...xAxisProps}
          />
          <YAxis
            className="**:[text]:fill-muted-fg"
            hide={hideYAxis}
            tickFormatter={type === 'percent' ? valueToPercent : valueFormatter}
            {...yAxisProps}
          />

          {legend && (
            <ChartLegend
              content={
                typeof legend === 'boolean' ? <ChartLegendContent /> : legend
              }
              {...legendProps}
            />
          )}

          {tooltip && (
            <ChartTooltip
              content={
                typeof tooltip === 'boolean' ? (
                  <ChartTooltipContent accessibilityLayer />
                ) : (
                  tooltip
                )
              }
              {...tooltipProps}
            />
          )}

          {Object.entries(config).map(([category, values]) => {
            const strokeOpacity =
              selectedLegend && selectedLegend !== category ? 0.1 : 1;

            return (
              <Line
                connectNulls={connectNulls}
                dataKey={category}
                dot={false}
                key={category}
                name={category}
                stroke={getColorValue(
                  values.color || categoryColors.get(category)
                )}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeOpacity,
                  strokeWidth: 2,
                }}
                type="linear"
                {...lineProps}
              />
            );
          })}
          {children}
        </LineChartPrimitive>
      )}
    </Chart>
  );
}
