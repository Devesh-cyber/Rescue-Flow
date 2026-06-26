import logging
import sys

from data_extraction import TaskExtractor
from task_analysis import TaskAnalysisAgents
from execution_plan import ExecutionPlanAgent
from progress_tracker import ProgressTrackerAgent
from emergency_mode import EmergencyModeAgent

from database.task_repository import TaskRepository

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

def main():
    try:
        user_input = input("Enter PDF/Image path or text:\n")

        # -------------------------------
        # Step 1 : Extract
        # -------------------------------
        logging.info("Starting task extraction...")
        raw_task = TaskExtractor.extract(user_input)
        task_id = TaskRepository.create_task(raw_task)
        logging.info("Task extraction completed and stored.")

        # -------------------------------
        # Step 2 : Analysis
        # -------------------------------
        logging.info("Starting task analysis...")
        analysis_agent = TaskAnalysisAgents()
        analysis = analysis_agent.task_analysis(raw_task)
        TaskRepository.update_analysis(task_id, analysis)
        logging.info("Task analysis completed and stored.")

        # -------------------------------
        # Step 3 : Execution Plan
        # -------------------------------
        logging.info("Generating execution plan...")
        execution_agent = ExecutionPlanAgent()
        execution_plan = execution_agent.create_plan(analysis, raw_task)
        TaskRepository.update_execution(task_id, execution_plan.model_dump(mode="json"))
        logging.info("Execution plan generated and stored.")

        # -------------------------------
        # Step 4 : Progress
        # -------------------------------
        logging.info("Initializing progress tracker...")
        progress_agent = ProgressTrackerAgent()
        progress_agent.initialize_progress(str(task_id))
        logging.info("Progress initialized.")

        # -------------------------------
        # Step 5 : Emergency Mode
        # -------------------------------
        logging.info("Initializing emergency mode...")
        emergency_agent = EmergencyModeAgent()
        emergency_agent.update_emergency_mode(str(task_id))
        logging.info("Emergency Mode initialized.")

        logging.info("Pipeline completed successfully.")

    except Exception as e:
        logging.error(f"An error occurred during execution: {e}")
        # Never expose stack traces to the user directly, the logger handles printing the error cleanly.

if __name__ == "__main__":
    main()