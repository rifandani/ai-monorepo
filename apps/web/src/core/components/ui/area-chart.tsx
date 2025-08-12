'use client';

import type { ComponentProps } from 'react';
import { Fragment, useId } from 'react';
import { Area, AreaChart as AreaChartPrimitive } from 'recharts';
import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import type { CurveType } from 'recharts/types/shape/Curve';
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

interface AreaChartProps<TValue extends ValueType, TName extends NameType>
  extends BaseChartProps<TValue, TName> {
  chartProps?: Omit<
    ComponentProps<typeof AreaChartPrimitive>,
    'data' | 'stackOffset'
  >;
  connectNulls?: boolean;
  fillType?: 'gradient' | 'solid' | 'none';
  lineType?: CurveType;
}

export function AreaChart<TValue extends ValueType, TName extends NameType>({
  data = [],
  dataKey,
  colors = DEFAULT_COLORS,
  connectNulls = false,
  type = 'default',
  className,

  fillType = 'gradient',
  config,
  children,

  // Components
  tooltip = true,
  tooltipProps,

  cartesianGridProps,

  legend = true,
  legendProps,

  intervalType = 'equidistantPreserveStart',

  valueFormatter = (value: number) => value.toString(),

  // XAxis
  displayEdgeLabelsOnly = false,
  hideXAxis = false,
  xAxisProps,

  // YAxis
  hideYAxis = false,
  yAxisProps,

  hideGridLines = false,
  lineType = 'linear',
  chartProps,
  ...props
}: AreaChartProps<TValue, TName>) {
  const categoryColors = constructCategoryColors(Object.keys(config), colors);
  const stacked = type === 'stacked' || type === 'percent';
  const areaId = useId();

  const getFillContent = ({
    fillType,
    activeLegend,
    category,
  }: {
    fillType: AreaChartProps<TValue, TName>['fillType'];
    activeLegend: string | null;
    category: string;
  }) => {
    const stopOpacity = activeLegend && activeLegend !== category ? 0.1 : 0.5;

    switch (fillType) {
      case 'none':
        return <stop stopColor="currentColor" stopOpacity={0} />;
      case 'gradient':
        return (
          <>
            <stop
              offset="5%"
              stopColor="currentColor"
              stopOpacity={stopOpacity}
            />
            <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
          </>
        );
      default:
        return <stop stopColor="currentColor" stopOpacity={stopOpacity} />;
    }
  };

  return (
    <Chart
      className={twMerge('w-full', className)}
      config={config}
      data={data}
      dataKey={dataKey}
      {...props}
    >
      {({ onLegendSelect, selectedLegend }) => (
        <AreaChartPrimitive
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
          {!hideGridLines && (
            <CartesianGrid {...cartesianGridProps} strokeDasharray="3 3" />
          )}
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
            const categoryId = `${areaId}-${category.replace(/[^a-z0-9]/gi, '')}`;

            const strokeOpacity =
              selectedLegend && selectedLegend !== category ? 0.1 : 1;

            return (
              <Fragment key={categoryId}>
                <defs>
                  <linearGradient
                    id={categoryId}
                    style={{
                      color: getColorValue(
                        values.color || categoryColors.get(category)
                      ),
                    }}
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    {getFillContent({
                      fillType,
                      activeLegend: selectedLegend,
                      category,
                    })}
                  </linearGradient>
                </defs>
                <Area
                  connectNulls={connectNulls}
                  dataKey={category}
                  dot={false}
                  fill={`url(#${categoryId})`}
                  isAnimationActive={true}
                  name={category}
                  stackId={stacked ? 'stack' : undefined}
                  stroke={getColorValue(
                    values.color || categoryColors.get(category)
                  )}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeWidth: 2,
                    strokeOpacity,
                  }}
                  type={lineType}
                />
              </Fragment>
            );
          })}
          {children}
        </AreaChartPrimitive>
      )}
    </Chart>
  );
}
