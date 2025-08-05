@echo off
echo Setting up news bot conda environment...

conda env create -f environments/environment.yml
if %errorlevel% neq 0 (
    echo Failed to create conda environment
    pause
    exit /b 1
)

echo.
echo Environment created successfully!
echo.
echo To activate the environment, run:
echo conda activate newsbot
echo.
echo Then install additional pip packages:
echo pip install -r requirements.txt
echo.
pause