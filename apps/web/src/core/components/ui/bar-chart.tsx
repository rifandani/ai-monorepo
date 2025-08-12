'use client';

import type { ComponentProps } from 'react';
import { startTransition } from 'react';
import { Bar, BarChart as BarChartPrimitive } from 'recharts';
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

interface BarChartProps<TValue extends ValueType, TName extends NameType>
  extends BaseChartProps<TValue, TName> {
  barCategoryGap?: number;
  barRadius?: number;
  barGap?: number;
  barSize?: number;

  chartProps?: Omit<
    ComponentProps<typeof BarChartPrimitive>,
    'data' | 'stackOffset'
  >;
}

function BarChart<TValue extends ValueType, TName extends NameType>({
  data = [],
  dataKey,
  lineType: _lineType = 'linear',
  colors = DEFAULT_COLORS,
  type = 'default',
  className,
  config,
  children,
  layout = 'horizontal',

  // Components
  tooltip = true,
  tooltipProps,

  legend = true,
  legendProps,

  intervalType = 'equidistantPreserveStart',

  barCategoryGap = 5,
  barGap,
  barSize,
  barRadius,

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
  ...props
}: BarChartProps<TValue, TName>) {
  const categoryColors = constructCategoryColors(Object.keys(config), colors);

  const stacked = type === 'stacked' || type === 'percent';

  return (
    <Chart
      className={twMerge('w-full', className)}
      config={config}
      data={data}
      dataKey={dataKey}
      layout={layout}
      {...props}
    >
      {/** biome-ignore lint/complexity/noExcessiveCognitiveComplexity: xxx */}
      {({ onLegendSelect, selectedLegend }) => (
        <BarChartPrimitive
          barCategoryGap={barCategoryGap}
          barGap={barGap}
          barSize={barSize}
          data={data}
          layout={layout === 'radial' ? 'horizontal' : layout}
          margin={{
            bottom: 0,
            left: 5,
            right: 0,
            top: 5,
          }}
          onClick={() => {
            onLegendSelect(null);
          }}
          stackOffset={
            type === 'percent' ? 'expand' : stacked ? 'sign' : undefined
          }
          {...chartProps}
        >
          {!hideGridLines && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            className="**:[text]:fill-muted-fg"
            displayEdgeLabelsOnly={displayEdgeLabelsOnly}
            // Chart Data
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

          {/** biome-ignore lint/complexity/noExcessiveCognitiveComplexity: xxx */}
          {Object.entries(config).map(([category, values]) => {
            return (
              <Bar
                dataKey={category}
                fill={getColorValue(
                  values.color || categoryColors.get(category)
                )}
                fillOpacity={
                  selectedLegend && selectedLegend !== category ? 0.1 : 1
                }
                key={category}
                name={category}
                onClick={(_item, _number, event) => {
                  event.stopPropagation();

                  startTransition(() => {
                    onLegendSelect(category);
                  });
                }}
                radius={barRadius ?? (stacked ? undefined : 4)}
                stackId={stacked ? 'stack' : undefined}
                stroke={getColorValue(
                  values.color || categoryColors.get(category)
                )}
                strokeOpacity={
                  selectedLegend && selectedLegend !== category ? 0.2 : 0
                }
                strokeWidth={1}
              />
            );
          })}
          {children}
        </BarChartPrimitive>
      )}
    </Chart>
  );
}

export type { BarChartProps };
export { BarChart };
