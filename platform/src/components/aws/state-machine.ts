import { Component, Transform, transform } from "../component";
import { ComponentResourceOptions, Output } from "@pulumi/pulumi";
import { Link } from "../link";
import { sfn } from "@pulumi/aws";
import { StateMachineArgs as PulumiStateMachineArgs } from "@pulumi/aws/sfn";
import { Input } from "../input";
import { physicalName } from "../naming";

type QueryLanguage = 'JSONPath' | 'JSONata' | string;

interface States {
  [key: string]: any;
}

export interface StateMachineDefinition {
  StartAt: keyof States;
  States: States;
  QueryLanguage?: QueryLanguage;
  Comment?: string;
  Version?: string;
  TimeoutSeconds?: number;
}

export interface StateMachineArgs extends Omit<PulumiStateMachineArgs, 'definition'> {
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
    opts: ComponentResourceOptions = {}
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
            roleArn: args.roleArn
          } as PulumiStateMachineArgs,
          { parent: self }
        )
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
      stateMachine: sfn.StateMachine.get(`${name}StateMachine`, stateMachineName, undefined, opts)
    } satisfies StateMachineRef as unknown as StateMachineArgs);
  }

  /** @internal */
  public getSSTLink() {
    return {
      properties: {
        arn: this.arn
      }
    }
  }
}

const __pulumiType = "sst:aws:StateMachine";
// @ts-expect-error
StateMachine.__pulumiType = __pulumiType;
