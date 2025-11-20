import os
import re
import sys

def scan_file(filepath):
    issues = []
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        lines = content.split('\n')
        
        # 1. Hardcoded Secrets
        if re.search(r'(api_key|apikey|secret|password|passwd|pwd)\s*=\s*[\'"][^\'"]+[\'"]', content, re.IGNORECASE):
            # Exclude env var reads
            if "os.getenv" not in content and "process.env" not in content:
                 # This is a naive check, might have false positives
                 pass 
            
            # refined regex for actual hardcoded strings
            matches = re.finditer(r'(api_key|apikey|secret|password|passwd|pwd)\s*=\s*[\'"](?P<val>[^\'"]+)[\'"]', content, re.IGNORECASE)
            for match in matches:
                val = match.group('val')
                if not val.startswith('$') and not val.startswith('%') and len(val) > 5:
                     issues.append(f"Possible hardcoded secret: {match.group(0)}")

        # 2. Insecure Configurations
        if "debug=True" in content or "debug = True" in content:
             issues.append("Debug mode enabled (debug=True)")

        # 3. Dangerous Functions
        if re.search(r'\beval\(', content):
            issues.append("Dangerous function usage: eval()")
        if re.search(r'\bexec\(', content):
            issues.append("Dangerous function usage: exec()")
        if re.search(r'dangerouslySetInnerHTML', content):
            issues.append("React dangerous usage: dangerouslySetInnerHTML")

    return issues

def scan_directory(root_dir):
    all_issues = {}
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if '__pycache__' in dirs:
            dirs.remove('__pycache__')
            
        for file in files:
            if file.endswith(('.py', '.js', '.ts', '.tsx', '.jsx')):
                filepath = os.path.join(root, file)
                issues = scan_file(filepath)
                if issues:
                    all_issues[filepath] = issues
    return all_issues

if __name__ == "__main__":
    print("Starting Security Scan...")
    root_dir = os.getcwd()
    issues = scan_directory(root_dir)
    
    if issues:
        print(f"\nFound {len(issues)} files with potential issues:\n")
        for filepath, file_issues in issues.items():
            print(f"File: {filepath}")
            for issue in file_issues:
                print(f"  - {issue}")
            print("")
    else:
        print("\nNo obvious vulnerabilities found.")
