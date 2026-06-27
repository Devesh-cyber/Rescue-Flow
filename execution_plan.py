from typing import List, Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
import json
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

load_dotenv()


class Step(BaseModel):

    step_id: str = Field(
    default="",
    description="Unique identifier like P1-S1"
)
    
    step_no: int = Field(
    ge=1,
    description="Sequential execution step within its phase."
)
    
    title: str = Field(
        description="Short title."
    )

    objective: str = Field(
        description="Goal of this step."
    )

    description: str = Field(
        description="Detailed explanation of the work."
    )

    estimated_hours: float = Field(
    gt=0,
    description="Estimated hours required."
)

    priority: Literal[
    "Low",
    "Medium",
    "High",
    "Critical"
]

    dependencies: List[str] = Field(
    default_factory=list,
    description="List of prerequisite step IDs."
)

    deliverables: List[str] = Field(
        default_factory=list,
        description="Outputs produced after completing this step."
    )

    prerequisites: List[str] = Field(
        default_factory=list,
        description="Concepts the user must understand before performing this step."
    )

    verification_checklist: List[str] = Field(
        default_factory=list,
        description="Checklist used to verify completion."
    )

    emergency_priority: Literal[
    "Mandatory",
    "Recommended",
    "Optional"
] = "Mandatory"

    status: Literal['Pending','In Progress', 'Completed'] = 'Pending'

class Phase(BaseModel):

    phase_no: int = Field(
    ge=1,
    description="Sequential phase number."
)

    title: str = Field(
    description="Short title of the phase."
)

    phase_objective: str = Field(
    description="Objective of this phase."
)

    description: str = Field(
    description="Detailed description of this phase."
)


    steps: List[Step] = Field(
    description="Execution steps belonging to this phase."
)

    estimated_hours: float = Field(
    default=0,
    ge=0,
    description="Total estimated hours for this phase."
)

    completion_percentage: float = Field(
    default=0,
    ge=0,
    le=100,
    description="Completion percentage of the phase."
)
    

class ExecutionPlan(BaseModel):

    phases: List[Phase]

    critical_path: List[str] = Field(
    default_factory=list,
    description="IDs of mandatory execution steps."
)
    
    total_estimated_hours: float = Field(
    default=0.0,
    description="Total estimated hours for the entire plan."
)


def validate_execution_plan(plan: ExecutionPlan) -> None:

    seen_step_ids = set()
    seen_phase_nos = set()

    all_step_ids = {
        step.step_id
        for phase in plan.phases
        for step in phase.steps
    }

    for phase in plan.phases:

        if phase.phase_no in seen_phase_nos:
            logging.error(
                f"Validation failure: Duplicate phase number {phase.phase_no}"
            )
            raise ValueError(
                f"Duplicate phase number {phase.phase_no}"
            )

        seen_phase_nos.add(phase.phase_no)

        for step in phase.steps:

            if step.step_id in seen_step_ids:
                logging.error(
                    f"Validation failure: Duplicate step ID {step.step_id}"
                )
                raise ValueError(
                    f"Duplicate step ID {step.step_id}"
                )

            seen_step_ids.add(step.step_id)

            for dep in step.dependencies:

                if dep == step.step_id:
                    logging.error(
                        f"Validation failure: Self dependency found '{dep}'"
                    )
                    raise ValueError(
                        f"Self dependency found '{dep}'"
                    )

                if dep not in all_step_ids:
                    logging.error(
                        f"Validation failure: Dependency '{dep}' "
                        f"for step '{step.step_id}' does not exist."
                    )
                    raise ValueError(
                        f"Invalid dependency '{dep}' "
                        f"in step '{step.step_id}'"
                    )

    crit_set = set()

    for crit in plan.critical_path:

        if crit in crit_set:
            logging.error(
                f"Validation failure: Duplicate critical path item '{crit}'"
            )
            raise ValueError(
                f"Duplicate critical path item '{crit}'"
            )

        crit_set.add(crit)

        if crit not in all_step_ids:
            logging.error(
                f"Validation failure: critical_path item '{crit}' "
                f"does not match any step ID."
            )
            raise ValueError(
                f"Critical path item '{crit}' does not exist."
            )

class ExecutionPlanAgent:

    def __init__(self):

        llm = HuggingFaceEndpoint(
            repo_id="meta-llama/Llama-3.3-70B-Instruct",
            task="text-generation",
            temperature=0.2,
            max_new_tokens=2500
        )

        self.model = ChatHuggingFace(llm=llm)

        self.parser = PydanticOutputParser(
            pydantic_object=ExecutionPlan
        )

        self.prompt = PromptTemplate(
    template="""
You are Deadline Rescue, an AI execution coach specialized in helping students complete assignments, projects, hackathons and academic work before the deadline.

Your objective is NOT to solve the assignment.

Your objective is to convert the assignment into a realistic execution roadmap that maximizes the probability of successful submission before the deadline.

You will receive:

1. The original assignment.
2. AI extracted task analysis.

Use BOTH sources.

========================================================
STRICT RULES
========================================================

• Use ONLY information present in the assignment and task analysis.

• NEVER invent requirements, deliverables or features.

• NEVER invent project phases such as:
    - Project Planning
    - Requirements Gathering
    - Stakeholder Interviews
    - Deployment
    - Maintenance
    - Production Release
unless they are explicitly mentioned.

• Every phase must directly correspond to work required for completing the assignment.

• Every step must move the user closer to submission.

• Break large work into small executable sessions.

• One step should ideally be completable within a focused work session.

• Respect dependencies between steps.

• Prioritize implementation before polishing.

• Documentation, presentation and demo should appear only if required.

• Never generate source code.

• Never teach concepts.

• Never explain theory.

Focus only on WHAT the user should do.

Do not create environment setup phases unless the assignment explicitly requires installing or configuring software.

Assume a basic development environment already exists.

Prerequisites should describe work that must already be completed before this step.

Avoid generic knowledge such as:

Python Basics
Machine Learning
Git

Prefer task dependencies such as:

Database schema finalized

Login page completed

Authentication API implemented

Verify login works

Verify chatbot answers

Verify secure storage

Verify demo flow

Prepare project PDF

Include architecture

Include installation guide

Include screenshots
========================================================
PHASE GENERATION RULES
========================================================

Generate logical phases based on the assignment.

Typical examples include:

- Understanding the assignment
- Environment setup
- Core implementation
- Feature completion
- Testing
- Documentation
- Presentation
- Final submission

Do NOT force every phase.

Only include phases actually needed.

========================================================
STEP GENERATION RULES
========================================================

Every step must include:

• step_no

• title

• objective

• description

• estimated_hours

• priority

• dependencies

• deliverables

• prerequisites

• verification_checklist

• emergency_priority

Every step should describe ONE concrete action.

Avoid vague steps such as:

❌ Work on project

❌ Continue development

❌ Improve system

Instead use:

✅ Implement login page

✅ Connect MongoDB

✅ Test chatbot responses

✅ Record demo video

========================================================
DEPENDENCY RULES
========================================================

Dependencies must reference prerequisite step IDs.

Do not create circular dependencies.

A step should only depend on earlier steps.

========================================================
PRIORITY RULES
========================================================

Allowed values:

priority:

- Low
- Medium
- High
- Critical

Critical =
Submission blockers

High =
Core implementation

Medium =
Supporting work

Low =
Nice-to-have improvements

========================================================
EMERGENCY MODE
========================================================

Assign one value:

Mandatory
Recommended
Optional

Mandatory
=
Without this the assignment cannot be submitted.

Recommended
=
Improves marks but can be skipped if time is very limited.

Optional
=
Extra improvements that should be skipped first during emergency mode.

========================================================
ESTIMATION RULES
========================================================

Estimated hours should be realistic.

Avoid unrealistic values.

Split large tasks instead of assigning extremely large estimates.

========================================================
VERIFICATION RULES
========================================================

Verification checklist should contain measurable completion criteria.

Example:

✓ Login works

✓ PDF uploaded

✓ Chatbot answers correctly

✓ Documentation exported

Avoid generic items like:

❌ Done

❌ Completed

========================================================
OUTPUT RULES
========================================================

Return ONLY valid JSON.

The JSON MUST exactly match the provided schema.

Do not include explanations.

Do not include markdown.

Do not include comments.

Do not include additional fields.

Never invent implementation features.

If a feature is not explicitly required in the assignment,
do not create implementation steps for it.

When uncertain, prefer fewer steps instead of inventing work.

IMPORTANT

Every step MUST include ALL fields.

Never omit any field.

If a field has no value return an empty list.

Example

dependencies: []

deliverables: []

prerequisites: []

verification_checklist: []

Every step MUST include

emergency_priority

with ONLY one of

Mandatory

Recommended

Optional

The JSON MUST exactly match the schema.

If any field is missing the answer is invalid.

Project Information

{task}

{format_instructions}
""",
    input_variables=["task"],
    partial_variables={
        "format_instructions": self.parser.get_format_instructions()
    },
)

        self.chain = (
            self.prompt
            | self.model
            | self.parser
        )

    def create_plan(self, task_analysis, raw_task):
        
        planner_input = {
    "assignment": raw_task["content"],
    "analysis": task_analysis
}

        try:
    

            MAX_RETRIES = 3

            for attempt in range(MAX_RETRIES):
                try:
                    plan = self.chain.invoke(
                        {
                            "task": json.dumps(planner_input, indent=2)
                        }
                    )
                    break

                except Exception as e:
                    logging.warning(
                        f"Execution plan generation failed "
                        f"(attempt {attempt + 1}/{MAX_RETRIES}): {e}"
                    )

                    if attempt == MAX_RETRIES - 1:
                        raise RuntimeError(
                            "Failed to generate a valid execution plan."
                        ) from e
                    
        except Exception as e:
            logging.error(f"Execution Plan Error: {e}")
            raise

        if not plan.phases:
            raise ValueError(
                "Execution plan contains no phases."
            )

        # Normalize phase numbers first
        for idx, phase in enumerate(
            plan.phases,
            start=1
        ):
            phase.phase_no = idx

        # Calculate phase metadata
        for phase in plan.phases:

            phase.estimated_hours = sum(
                step.estimated_hours
                for step in phase.steps
            )

            phase.completion_percentage = 0

            for i, step in enumerate(
                phase.steps,
                start=1
            ):
                step.step_id = f"P{phase.phase_no}-S{i}"
                step.status = "Pending"

        plan.total_estimated_hours = sum(
        phase.estimated_hours
        for phase in plan.phases
    )
        
        plan.critical_path = [
            step.step_id
            for phase in plan.phases
            for step in phase.steps
            if step.emergency_priority == "Mandatory"
        ]
                    

        # Validate the generated plan
        validate_execution_plan(plan)
        logging.info("Plan generated and validated successfully.")

        return plan
                