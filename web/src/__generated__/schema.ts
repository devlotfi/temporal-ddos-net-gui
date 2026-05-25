export interface paths {
    "/precompute": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Precompute */
        post: operations["precompute_precompute_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/predict": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Predict */
        post: operations["predict_predict_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Timeline */
        get: operations["timeline_timeline_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/alerts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Alerts */
        get: operations["list_alerts_alerts_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/simulate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Simulate */
        get: operations["simulate_simulate_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/timeline_bounds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Timeline Bounds */
        get: operations["timeline_bounds_timeline_bounds_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** AlertItem */
        AlertItem: {
            /** Timestamp */
            timestamp: string;
            /** Score */
            score: number;
            /** Segment */
            segment: string;
            /** Status */
            status: string;
        };
        /** AlertsResponse */
        AlertsResponse: {
            /** Model Used */
            model_used: string;
            /** Data Day */
            data_day: string;
            /** Alerts */
            alerts: components["schemas"]["AlertItem"][];
        };
        /** ClassificationMetrics */
        ClassificationMetrics: {
            /** Precision */
            precision?: number | null;
            /** Recall */
            recall?: number | null;
            /** F1 */
            f1?: number | null;
        };
        /** ConfusionMatrix */
        ConfusionMatrix: {
            /** Tp */
            TP: number;
            /** Fp */
            FP: number;
            /** Fn */
            FN: number;
            /** Tn */
            TN: number;
        };
        /** EarlyMetrics */
        EarlyMetrics: {
            /** Seg Recall */
            seg_recall?: number | null;
            /** Median Delay S */
            median_delay_s?: number | null;
            /** P90 Delay S */
            p90_delay_s?: number | null;
            /** Fa Per Min */
            fa_per_min?: number | null;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** PrecomputeResponse */
        PrecomputeResponse: {
            /** Status */
            status: string;
            /** Model Used */
            model_used: string;
            /** Data Day */
            data_day: string;
            /** Message */
            message: string;
        };
        /** PredictResponse */
        PredictResponse: {
            /** Model Used */
            model_used: string;
            /** Data Day */
            data_day: string;
            /** Theta */
            theta: number;
            /** Scores Calibrated */
            scores_calibrated: number[];
            /** Alerts */
            alerts: number[];
            metrics: components["schemas"]["EarlyMetrics"];
            classification_metrics: components["schemas"]["ClassificationMetrics"];
            confusion_raw?: components["schemas"]["ConfusionMatrix"] | null;
        };
        /** SimulationPoint */
        SimulationPoint: {
            /** Timestamp */
            timestamp: string;
            /** Score */
            score?: number | null;
            /** Context Start */
            context_start?: string | null;
            /** Context End */
            context_end?: string | null;
        };
        /** SimulationResponse */
        SimulationResponse: {
            /** Model Used */
            model_used: string;
            /** Data Day */
            data_day: string;
            /** Points */
            points: components["schemas"]["SimulationPoint"][];
        };
        /** TimelineAlert */
        TimelineAlert: {
            /** Index */
            index: number;
            /** Timestamp */
            timestamp: string;
            /** Score */
            score: number;
        };
        /** TimelineBoundsResponse */
        TimelineBoundsResponse: {
            /** Data Day */
            data_day: string;
            /** First Timestamp */
            first_timestamp: string;
            /** Last Timestamp */
            last_timestamp: string;
        };
        /** TimelineResponse */
        TimelineResponse: {
            /** Model Used */
            model_used: string;
            /** Data Day */
            data_day: string;
            /** Timestamps */
            timestamps: string[];
            /** Scores */
            scores: number[];
            /** Smoothed Scores */
            smoothed_scores: number[];
            /** Segments */
            segments: components["schemas"]["TimelineSegment"][];
            /** Alerts */
            alerts: components["schemas"]["TimelineAlert"][];
        };
        /** TimelineSegment */
        TimelineSegment: {
            /** Name */
            name: string;
            /** Start */
            start: string;
            /** End */
            end: string;
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
            /** Input */
            input?: unknown;
            /** Context */
            ctx?: Record<string, never>;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    precompute_precompute_post: {
        parameters: {
            query: {
                /** @description Model day (03-11-cic2019 or 01-12-cic2019) */
                model: string;
                /** @description Validation day */
                day: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PrecomputeResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    predict_predict_post: {
        parameters: {
            query: {
                model: string;
                day: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PredictResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    timeline_timeline_get: {
        parameters: {
            query: {
                model: string;
                day: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TimelineResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_alerts_alerts_get: {
        parameters: {
            query: {
                model: string;
                day: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AlertsResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    simulate_simulate_get: {
        parameters: {
            query: {
                /** @description Model day (03-11-cic2019 or 01-12-cic2019) */
                model: string;
                /** @description Validation day */
                day: string;
                /** @description Start timestamp (ISO format, e.g. '2018-02-21 02:11:08') */
                start_ts: string;
                /** @description End timestamp (ISO format, e.g. '2018-02-21 02:33:29') */
                end_ts: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SimulationResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    timeline_bounds_timeline_bounds_get: {
        parameters: {
            query: {
                /** @description Validation day */
                day: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TimelineBoundsResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
