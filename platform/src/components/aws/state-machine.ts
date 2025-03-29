import {
  ComponentResourceOptions,
  interpolate,
  output,
  Output,
} from "@pulumi/pulumi";
import { getRegionOutput, iam, sfn } from "@pulumi/aws";
import { StateMachineArgs as PulumiStateMachineArgs } from "@pulumi/aws/sfn";
import { Component, Transform, transform } from "../component";
import { Input } from "../input";
import { Link } from "../link";
import { physicalName } from "../naming";
import { parseRoleArn } from "./helpers/arn";

type Never<T, U> = {
  [K in Exclude<keyof U, keyof T>]?: never;
};
type Either<T, U> = (T & Never<T, U>) | (U & Never<U, T>);

type QueryLanguage = "JSONata" | "JSONPath" | string;

interface JSONArray extends Array<JSONValue> {}
interface JSONObject {
  [key: string]: JSONValue;
}
type JSONValue = string | number | boolean | null | JSONObject | JSONArray;

type JSONataExpression = string;
type JSONataArguments = JSONValue | JSONataExpression;
type JSONataOutput = JSONValue | JSONataExpression;
type JSONatalike = {
  Arguments: JSONataArguments;
  Output: JSONataOutput;
} & {
  BatchInput: JSONObject | JSONataExpression;
  Items: JSONObject[] | JSONataExpression;
  ItemSelector: JSONObject | JSONataExpression;
};

type JSONPathInputPath = string | null;
type JSONPathOutputpath = string | null;
type JSONPathParameters = JSONObject;
type JSONPathResult = JSONValue;
type JSONPathResultPath = string | null;
type JSONPathResultSelector = JSONObject;
type JSONPathlike = {
  InputPath: JSONPathInputPath;
  OutputPath: JSONPathOutputpath;
  Parameters: JSONPathParameters;
  Result: JSONPathResult;
  ResultPath: JSONPathResultPath;
  ResultSelector: JSONPathResultSelector;
} & {
  BatchInput: JSONObject;
  ItemsPath: string;
  ItemSelector: JSONObject;
};

type Error = {
  Error?: string | JSONataExpression;
};
type Cause = {
  Cause?: string | JSONataExpression;
};
type ErrorPath = {
  ErrorPath?: string;
};
type CausePath = {
  CausePath?: string;
};

type Seconds = {
  Seconds: number | JSONataExpression;
};
type Timestamp = {
  Timestamp: string | JSONataExpression;
};
type SecondsPath = {
  SecondsPath: string;
};
type TimestampPath = {
  TimestampPath: string;
};

type SecondsOrTimestamp = Either<Seconds, Timestamp>;
type SecondsPathOrTimestampPath = Either<SecondsPath, TimestampPath>;

type ComparisonOperatorType =
  | "StringEquals"
  | "StringEqualsPath"
  | "StringLessThan"
  | "StringLessThanPath"
  | "StringGreaterThan"
  | "StringGreaterThanPath"
  | "StringLessThanEquals"
  | "StringLessThanEqualsPath"
  | "StringGreaterThanEquals"
  | "StringGreaterThanEqualsPath"
  | "StringMatches"
  | "NumericEquals"
  | "NumericEqualsPath"
  | "NumericLessThan"
  | "NumericLessThanPath"
  | "NumericGreaterThan"
  | "NumericGreaterThanPath"
  | "NumericLessThanEquals"
  | "NumericLessThanEqualsPath"
  | "NumericGreaterThanEquals"
  | "NumericGreaterThanEqualsPath"
  | "BooleanEquals"
  | "BooleanEqualsPath"
  | "TimestampEquals"
  | "TimestampEqualsPath"
  | "TimestampLessThan"
  | "TimestampLessThanPath"
  | "TimestampGreaterThan"
  | "TimestampGreaterThanPath"
  | "TimestampLessThanEquals"
  | "TimestampLessThanEqualsPath"
  | "TimestampGreaterThanEquals"
  | "TimestampGreaterThanEqualsPath"
  | "IsNull"
  | "IsPresent"
  | "IsNumeric"
  | "IsString"
  | "IsBoolean"
  | "IsTimestamp";
type ComparisonOperatorFields = {
  [K in ComparisonOperatorType]?: JSONValue;
};
type ComparisonOperator = {
  [K in keyof ComparisonOperatorFields]: {
    [P in K]: ComparisonOperatorFields[K];
  } & Partial<Record<Exclude<keyof ComparisonOperatorFields, K>, never>>;
}[keyof ComparisonOperatorFields];

type StateName = string;
type StateType =
  | "Choice"
  | "Fail"
  | "Map"
  | "Parallel"
  | "Pass"
  | "Succeed"
  | "Task"
  | "Wait";
type States = Record<StateName, State>;

type ErrorCode =
  | "States.ALL"
  | "States.HeartbeatTimeout"
  | "States.Timeout"
  | "States.TaskFailed"
  | "States.Permissions"
  | "States.ResultPathMatchFailure"
  | "States.ParameterPathFailure"
  | "States.QueryEvaluationError"
  | "States.BranchFailed"
  | "States.NoChoiceMatched"
  | "States.IntrinsicFailure"
  | "States.ExceedToleratedFailureThreshold"
  | "States.ItemReaderFailed"
  | "States.ResultWriterFailed"
  | string;

type Retrier = {
  ErrorEquals: ErrorCode[];
  IntervalSeconds?: number;
  MaxAttempts?: number;
  MaxDelaySeconds?: number;
  JitterStrategy?: string;
  BackoffRate?: number;
};

type Catcher = Assignable &
  Either<
    Partial<Pick<JSONatalike, "Output">>,
    Partial<Pick<JSONPathlike, "ResultPath">>
  > & {
    ErrorEquals: ErrorCode[];
    Next: StateName;
    Comment?: string;
  };

type Condition = {
  Condition: boolean | JSONataExpression;
};

type BooleanExpression = Either<
  Either<{ And: ChoiceRule[] }, { Or: ChoiceRule[] }>,
  { Not: ChoiceRule }
>;

type DatatestExpression = {
  Variable: string;
} & ComparisonOperator;

type ChoiceRule = Assignable &
  Either<
    Condition & Partial<Pick<JSONatalike, "Output">>,
    Either<BooleanExpression, DatatestExpression>
  >;

type Choice = ChoiceRule & Nextable;

type Branch = {
  StartAt: StateName;
  States: States;
};

type InlineProcessorConfig = {
  Mode: "INLINE";
};
type DistributedProcessorConfig = {
  Mode: "DISTRIBUTED";
  ExecutionType: "STANDARD" | "STANDARD";
};
type ProcessorConfig = Either<
  InlineProcessorConfig,
  DistributedProcessorConfig
>;
type ItemProcessorType = {
  StartAt: StateName;
  States: States;
  ProcessorConfig?: ProcessorConfig;
};

type ItemProcessor = {
  ItemProcessor: ItemProcessorType;
};
type Iterator = {
  Iterator: ItemProcessorType;
};

type ReaderConfig = Either<
  {
    MaxItems?: number | JSONataExpression;
  },
  {
    MaxItemsPath?: string;
  }
> & {
  InputType?: "CSV" | "JSON" | "JSONL" | "MANIFEST";
  CSVDelimiter?: "COMMA" | "PIPE" | "SEMICOLON" | "SPACE" | "TAB";
  CSVHeaderLocation?: "FIRST_ROW" | "GIVEN";
  CSVHeaders?: string[];
};
type ItemReader = Either<
  Partial<Pick<JSONatalike, "Arguments">>,
  Partial<Pick<JSONPathlike, "Parameters">>
> & {
  Resource: string;
  ReaderConfig?: ReaderConfig;
};

type ItemBatcher = Either<
  Partial<Pick<JSONatalike, "BatchInput">>,
  Partial<Pick<JSONPathlike, "BatchInput">>
> &
  (
    | Either<
        {
          MaxItemsPerBatch: number | JSONataExpression;
        },
        {
          MaxItemsPerBatchPath: string;
        }
      >
    | Either<
        {
          MaxInputBytesPerBatch: number | JSONataExpression;
        },
        {
          MaxInputBytesPerBatchPath: string;
        }
      >
  );

type ResultWriter = Either<
  Partial<Pick<JSONatalike, "Arguments">>,
  Partial<Pick<JSONPathlike, "Parameters">>
> & {
  Resource: string;
};

interface BaseState {
  Type: StateType;
  Comment?: string;
  QueryLanguage?: QueryLanguage;
}

interface Assignable {
  Assign?: Record<string, JSONValue>;
}

interface Endable {
  End: true;
}

interface Nextable {
  Next: StateName;
}

interface Retriable {
  Retry?: Retrier[];
}

interface Catchable {
  Catch?: Catcher[];
}

type Timeoutable = Either<
  {
    TimeoutSeconds?: number | JSONataExpression;
  },
  {
    TimeoutSecondsPath?: string;
  }
>;

type Heartbeatable = Either<
  {
    HeartbeatSeconds?: number | JSONataExpression;
  },
  {
    HeartbeatSecondsPath?: string;
  }
>;

type FailureTolerable = Either<
  {
    ToleratedFailureCount?: number | JSONataExpression;
  },
  {
    ToleratedFailureCountPath?: string;
  }
> &
  Either<
    {
      ToleratedFailurePercentage?: number | JSONataExpression;
    },
    {
      ToleratedFailurePercentagePath?: string;
    }
  >;

type EndableOrNextable = Either<Endable, Nextable>;

type ChoiceState = BaseState &
  Assignable &
  Either<
    Partial<Pick<JSONatalike, "Output">>,
    Partial<Pick<JSONPathlike, "InputPath" | "OutputPath">>
  > & {
    readonly Type: "Choice";
    Choices: Choice[];
    Default?: string;
  };

type FailState = BaseState &
  Either<Error, ErrorPath> &
  Either<Cause, CausePath> & {
    readonly Type: "Fail";
  };

type MapState = BaseState &
  EndableOrNextable &
  Assignable &
  Retriable &
  Catchable &
  FailureTolerable &
  Either<ItemProcessor, Iterator> &
  Either<
    Partial<Pick<JSONatalike, "Items" | "Output">>,
    Partial<
      Pick<
        JSONPathlike,
        | "InputPath"
        | "ItemSelector"
        | "Parameters"
        | "OutputPath"
        | "ResultPath"
        | "ResultSelector"
      >
    >
  > &
  Either<
    {
      MaxConcurrency?: number | JSONataExpression;
    },
    {
      MaxConcurrencyPath?: string;
    }
  > & {
    readonly Type: "Map";
    ItemReader?: ItemReader;
    ItemBatcher?: ItemBatcher;
    ResultWriter?: ResultWriter;
  };

type ParallelState = BaseState &
  EndableOrNextable &
  Assignable &
  Retriable &
  Catchable &
  Either<
    Partial<Pick<JSONatalike, "Arguments" | "Output">>,
    Partial<
      Pick<
        JSONPathlike,
        | "InputPath"
        | "OutputPath"
        | "Parameters"
        | "ResultPath"
        | "ResultSelector"
      >
    >
  > & {
    readonly Type: "Parallel";
    Branches: Branch[];
  };

type PassState = BaseState &
  EndableOrNextable &
  Assignable &
  Either<
    Partial<Pick<JSONatalike, "Output">>,
    Partial<
      Pick<
        JSONPathlike,
        "InputPath" | "OutputPath" | "Parameters" | "Result" | "ResultPath"
      >
    >
  > & {
    readonly Type: "Pass";
  };

type SucceedState = BaseState &
  Either<
    Partial<Pick<JSONatalike, "Output">>,
    Partial<Pick<JSONPathlike, "InputPath" | "OutputPath">>
  > & {
    readonly Type: "Succeed";
  };

type TaskState = BaseState &
  EndableOrNextable &
  Assignable &
  Retriable &
  Catchable &
  Timeoutable &
  Heartbeatable &
  Either<
    Partial<Pick<JSONatalike, "Arguments" | "Output">>,
    Partial<
      Pick<
        JSONPathlike,
        | "InputPath"
        | "OutputPath"
        | "Parameters"
        | "ResultPath"
        | "ResultSelector"
      >
    >
  > & {
    readonly Type: "Task";
    Resource: string;
    Credentials?: JSONValue;
  };

type WaitState = BaseState &
  EndableOrNextable &
  Assignable &
  Either<
    Partial<Pick<JSONatalike, "Output">> & SecondsOrTimestamp,
    Partial<Pick<JSONPathlike, "InputPath" | "OutputPath">> &
      Either<SecondsOrTimestamp, SecondsPathOrTimestampPath>
  > & {
    readonly Type: "Wait";
  };

type State =
  | ChoiceState
  | FailState
  | MapState
  | ParallelState
  | PassState
  | SucceedState
  | TaskState
  | WaitState;

export interface StateMachineDefinition {
  StartAt: StateName;
  States: States;
  QueryLanguage?: QueryLanguage;
  Comment?: string;
  Version?: string;
  TimeoutSeconds?: number;
}

export interface StateMachineArgs
  extends Omit<PulumiStateMachineArgs, "definition" | "roleArn"> {
  /**
   * The [Amazon States Language](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html)
   * definition of the state machine.
   */
  definition: StateMachineDefinition;
  /**
   * The Amazon Resource Name (ARN) of the IAM role to use for this state machine.
   */
  roleArn?: string;
  /**
   * [Transform](/docs/components#transform) how this component creates its underlying
   * resources.
   */
  transform?: {
    /**
     * Transform the Step Functions State Machine resource.
     */
    stateMachine?: Transform<sfn.StateMachineArgs>;
    /**
     * Transform the IAM Role resource.
     */
    role?: Transform<iam.RoleArgs>;
  };
}

interface StateMachineRef {
  ref: boolean;
  stateMachine: sfn.StateMachine;
}

export class StateMachine extends Component implements Link.Linkable {
  private constructorName: string;
  private constructorOpts: ComponentResourceOptions;
  private stateMachine: Output<sfn.StateMachine>;
  private region: Output<string>;

  constructor(
    name: string,
    args: StateMachineArgs,
    opts: ComponentResourceOptions = {},
  ) {
    super(__pulumiType, name, args, opts);

    const self = this;
    const region = normalizeRegion();
    const role = createStateMachineRole();
    const stateMachine = createStateMachine();

    this.constructorName = name;
    this.constructorOpts = opts;
    this.region = region;
    this.stateMachine = stateMachine as unknown as Output<sfn.StateMachine>;

    function normalizeRegion() {
      return getRegionOutput(undefined, { parent: self }).name;
    }

    function createStateMachineRole() {
      if (args.roleArn) {
        return iam.Role.get(
          `${name}StateMachineRole`,
          output(args.roleArn).apply(parseRoleArn).roleName,
          {},
          { parent: self },
        );
      }

      return new iam.Role(
        ...transform(
          args.transform?.role,
          `${name}StateMachineRole`,
          {
            name: `${name}StateMachineRole`,
            assumeRolePolicy: iam.assumeRolePolicyForPrincipal({
              Service: interpolate`states.${region}.amazonaws.com`,
            }),
          },
          {
            parent: self,
          },
        ),
      );
    }

    function createStateMachine() {
      return new sfn.StateMachine(
        ...transform(
          args.transform?.stateMachine,
          `${name}StateMachine`,
          {
            name: physicalName(80, name),
            definition: $jsonStringify(args.definition),
            roleArn: role.arn,
          },
          { parent: self },
        ),
      );
    }
  }

  /**
   * The ARN of the Step Functions State Machine.
   */
  public get arn() {
    return this.stateMachine.name;
  }

  /**
   * The name of the Step Functions State Machine.
   */
  public get name() {
    return this.stateMachine.name;
  }

  /**
   * The underlying [resources](/docs/components/#nodes) this component creates.
   */
  public get nodes() {
    return {
      /**
       * The Amazon Step Functions State Machine.
       */
      stateMachine: this.stateMachine,
    };
  }

  /**
   * Reference an existing Step Functions State Machine with the given state machine name. This is
   * useful when you create a state machine in one stage and want to share it in another stage. It
   * avoid having to create a new state machine in the other stage.
   *
   * :::tip
   * You can use the `static get` method to share a State Machine across stages.
   * :::
   *
   * @param name The name of the component.
   * @param stateMachineName The name of the Step Functions State Machine.
   * @param opts? Resource options.
   *
   * @example
   * Imagine you create a state machine in the `dev` stage. And in your personal stage `frank`,
   * instead of creating a new state machine, you want to share the state machine from `dev`.
   *
   * ```ts title=sst.config.ts"
   * const stateMachine = $app.stage === "frank"
   *  ? sst.aws.StateMachine.get("MyStateMachine", "app-dev-mystatemachine")
   *  : new sst.aws.StateMachine("MyStateMachine");
   * ```
   *
   * Here `app-dev-mystatemachine` is the name of the Step Functions State Machine created in the
   * `dev` stage. You can find this by outputting the state machine name in the `dev` stage.
   *
   * ```ts title="sst.config.ts"
   * return {
   *   stateMachine: stateMachine.name
   * };
   * ```
   */
  public static get(
    name: string,
    stateMachineName: Input<string>,
    opts?: ComponentResourceOptions,
  ) {
    return new StateMachine(name, {
      ref: true,
      stateMachine: sfn.StateMachine.get(
        `${name}StateMachine`,
        stateMachineName,
        undefined,
        opts,
      ),
    } satisfies StateMachineRef as unknown as StateMachineArgs);
  }

  /** @internal */
  public getSSTLink() {
    return {
      properties: {
        id: this.stateMachine.id,
        arn: this.arn,
      },
    };
  }
}

const __pulumiType = "sst:aws:StateMachine";
// @ts-expect-error
StateMachine.__pulumiType = __pulumiType;
