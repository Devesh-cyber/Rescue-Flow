import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate

load_dotenv()

logger = logging.getLogger(__name__)

def parse_llm_deadline(deadline_str: Optional[str]) -> Optional[str]:
    if not deadline_str:
        return None
        
    try:
        is_missing_year = False
        if deadline_str.startswith("0000"):
            is_missing_year = True
            
        now = datetime.now(timezone.utc)
        current_year = now.year
        
        if is_missing_year:
            deadline_str = str(current_year) + deadline_str[4:]
            
        if deadline_str.endswith('Z'):
            deadline_str = deadline_str[:-1] + '+00:00'
            
        # Parse the datetime
        dt = datetime.fromisoformat(deadline_str)
        
        # Ensure timezone info
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
            
        # If we inferred the year and the date has already passed, it's likely next year
        if is_missing_year and dt < now:
            dt = dt.replace(year=current_year + 1)
            
        return dt.isoformat()
        
    except Exception as e:
        logger.warning(f"Failed to parse deadline '{deadline_str}': {e}. Setting deadline to null.")
        return None

class TaskAnalysis(BaseModel):
    title: str = Field(description="Short title of the task.")
    
    task_type: str = Field(
        description="Category of the task such as Machine Learning Project, Assignment, Report, Research Paper, Hackathon, etc."
    )
    
    summary: str = Field(
        description="A concise summary of what the task requires."
    )
    
    deadline: Optional[str] = Field(
        default=None,
        description="Submission deadline in ISO-8601 format (YYYY-MM-DDTHH:MM:SSZ). If the year is not explicitly mentioned, use 0000 as the year (e.g., 0000-06-29T23:59:59Z). If time is missing, default to 23:59:59Z. Return null if no deadline is mentioned at all."
    )
    
    difficulty: str = Field(
        description="Difficulty level. Choose only Easy, Medium or Hard."
    )
    
    estimated_hours: Optional[float] = Field(
        default=None,
        description="Estimated effort in hours. Infer a reasonable estimate whenever possible based on deliverables."
    )
    
    deliverables: List[str] = Field(
        description="List of final outputs explicitly required."
    )
    
    required_skills: List[str] = Field(
        description="Specific technologies, programming languages, frameworks and concepts required."
    )
    
    constraints: List[str] = Field(
        default_factory=list,
        description="Restrictions, rules, or conditions explicitly mentioned."
    )
    
    submission_requirements: List[str] = Field(
        default_factory=list,
        description="Specific instructions on how to submit the final work."
    )
    
    priority: str = Field(
        description="Choose only Low, Medium, High or Critical."
    )
    
    confidence: float = Field(
        ge=0,
        le=1,
        description="Confidence score."
    )

class TaskAnalysisAgents:

    def __init__(self) -> None:
        llm = HuggingFaceEndpoint(
            repo_id="meta-llama/Llama-3.3-70B-Instruct",
            task="text-generation",
            temperature=0.2,
            max_new_tokens=1024
        )
        self.model = ChatHuggingFace(llm=llm)
        self.parser = PydanticOutputParser(pydantic_object=TaskAnalysis)
        
        self.prompt = PromptTemplate(
            template="""
You are an expert task analysis assistant.

Your job is to understand an assignment and extract structured information.

Rules:
- NEVER invent or hallucinate information. If details like constraints or submission requirements are missing, return an empty list.
- Infer reasonable values for `estimated_hours` based on the complexity of the deliverables.
- `required_skills` should be specific technologies (e.g. Python, LangChain, FastAPI, SQL) instead of generic terms like AI or Programming.
- Accurate extraction of `deliverables`, `constraints`, and `submission_requirements` is critical. DO NOT guess them.
- Difficulty must be one of: Easy, Medium, Hard.
- Priority must be one of: Low, Medium, High, Critical.

Return ONLY the JSON.

Task:
{task}

{format_instructions}
""",
            input_variables=["task"],
            partial_variables={
                "format_instructions": self.parser.get_format_instructions()
            },
        )
        self.chain = self.prompt | self.model | self.parser

    def task_analysis(self, raw_task: Dict[str, Any]) -> Dict[str, Any]:
        logger.info("Invoking LLM for task analysis...")
        try:
            result = self.chain.invoke({"task": raw_task.get("content", "")})
            
            # Post-process deadline
            result.deadline = parse_llm_deadline(result.deadline)
            
            analysis_json = result.model_dump(mode='json')
            return analysis_json
        except Exception as e:
            logger.error(f"Task analysis failed: {e}")
            raise RuntimeError(f"Error during task analysis: {e}") from e