import { ComponentResourceOptions, Output } from "@pulumi/pulumi";
import { sfn } from "@pulumi/aws";
import { StateMachineArgs as PulumiStateMachineArgs } from "@pulumi/aws/sfn";
import { Component, Transform, transform } from "../component";
import { Input } from "../input";
import { Link } from "../link";
import { physicalName } from "../naming";

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;

interface JSONObject {
  [key: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> {}

type JSONataExpression = string;
type JSONataOutputType = JSONValue | JSONataExpression;
type JSONataOutput = {
  Output: JSONataOutputType;
};

type JSONPathResulType = JSONValue;
type JSONPathResultPathType = string;
type JSONPathParametersType = Record<string, unknown>;
type JSONPathResult = {
  Parameters: JSONPathParametersType;
  Result: JSONPathResulType;
  ResultPath: JSONPathResultPathType;
};

type Never<T, U> = {
  [K in Exclude<keyof U, keyof T>]?: never;
};
type Either<T, U> = (T & Never<T, U>) | (U & Never<U, T>);

type QueryLanguage = "JSONata" | "JSONPath" | string;

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
    Partial<JSONataOutput>,
    Partial<Pick<JSONPathResult, "ResultPath">>
  > & {
    ErrorEquals: ErrorCode[];
    Next: StateName;
    Comment?: string;
  };

interface BaseState {
  Type: StateType;
  Comment?: string;
  QueryLanguage?: QueryLanguage;
}

interface Assignable {
  Assign?: Record<string, unknown>;
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

type EndableOrNextable = Either<Endable, Nextable>;

type ChoiceState = BaseState &
  Assignable & {
    readonly Type: "Choice";
  };

type FailState = BaseState & {
  readonly Type: "Fail";
};

type MapState = BaseState &
  EndableOrNextable &
  Assignable &
  Retriable &
  Catchable & {
    readonly Type: "Map";
  };

type ParallelState = BaseState &
  EndableOrNextable &
  Assignable &
  Retriable &
  Catchable & {
    readonly Type: "Parallel";
  };

type PassState = BaseState &
  EndableOrNextable &
  Assignable &
  Either<Partial<JSONataOutput>, Partial<JSONPathResult>> & {
    readonly Type: "Pass";
  };

type SucceedState = BaseState & {
  readonly Type: "Succeed";
};

type TaskState = BaseState &
  EndableOrNextable &
  Assignable &
  Retriable &
  Catchable & {
    readonly Type: "Task";
  };

type WaitState = BaseState &
  EndableOrNextable &
  Assignable & {
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
  States: Record<StateName, State>;
  QueryLanguage?: QueryLanguage;
  Comment?: string;
  Version?: string;
  TimeoutSeconds?: number;
}

export interface StateMachineArgs
  extends Omit<PulumiStateMachineArgs, "definition"> {
  /**
   * The [Amazon States Language](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html)
   * definition of the state machine.
   */
  definition: StateMachineDefinition;
  /**
   * [Transform](/docs/components#transform) how this component creates its underlying
   * resources.
   */
  transform?: {
    /**
     * Transform the Step Functions State Machine resource.
     */
    bus?: Transform<sfn.StateMachineArgs>;
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

  constructor(
    name: string,
    args: StateMachineArgs,
    opts: ComponentResourceOptions = {},
  ) {
    super(__pulumiType, name, args, opts);
    const self = this;
    this.constructorName = name;
    this.constructorOpts = opts;

    const stateMachine = createStateMachine();

    this.stateMachine = stateMachine as unknown as Output<sfn.StateMachine>;

    function createStateMachine() {
      return new sfn.StateMachine(
        ...transform(
          undefined,
          `${name}StateMachine`,
          {
            name: physicalName(80, name),
            definition: $jsonStringify(args.definition),
            roleArn: args.roleArn,
          } as PulumiStateMachineArgs,
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
        arn: this.arn,
      },
    };
  }
}

const __pulumiType = "sst:aws:StateMachine";
// @ts-expect-error
StateMachine.__pulumiType = __pulumiType;
