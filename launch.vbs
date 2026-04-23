' ============================================================
' AI需求分析系统 - 静默启动器 (VBScript)
' 功能: 双击启动，无黑窗口，后台运行服务
' ============================================================

Option Explicit

Dim WshShell, FSO, ScriptDir
Dim BackendDir, FrontendDir, EnvFile
Dim BackendPort, FrontendPort

BackendPort = 8000
FrontendPort = 5173

Set FSO = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

' 获取脚本所在目录
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
BackendDir = FSO.BuildPath(ScriptDir, "backend")
FrontendDir = FSO.BuildPath(ScriptDir, "frontend")
EnvFile = FSO.BuildPath(BackendDir, ".env")

' ---------- 检查环境 ----------
If Not CheckCommand("python") Then
    MsgBox "未检测到 Python，请先安装 Python 3.9+" & vbCrLf & _
           "下载地址: https://www.python.org/downloads/", _
           vbCritical, "AI需求分析系统 - 环境错误"
    WScript.Quit 1
End If

If Not CheckCommand("node") Then
    MsgBox "未检测到 Node.js，请先安装 Node.js 18+" & vbCrLf & _
           "下载地址: https://nodejs.org/", _
           vbCritical, "AI需求分析系统 - 环境错误"
    WScript.Quit 1
End If

' ---------- 检查 .env ----------
If Not FSO.FileExists(EnvFile) Then
    Dim EnvExample
    EnvExample = FSO.BuildPath(BackendDir, ".env.example")
    If FSO.FileExists(EnvExample) Then
        FSO.CopyFile EnvExample, EnvFile
        MsgBox "已自动创建 .env 配置文件，请编辑填入您的 OpenAI API Key", _
               vbExclamation, "AI需求分析系统 - 需要配置"
    Else
        MsgBox "未找到 .env 配置文件", vbCritical, "AI需求分析系统 - 错误"
        WScript.Quit 1
    End If
End If

' ---------- 检查API Key ----------
Dim HasApiKey
HasApiKey = CheckApiKey(EnvFile)
If Not HasApiKey Then
    Dim Result
    Result = MsgBox("OpenAI API Key 未配置或仍为默认值。" & vbCrLf & _
                    "是否仍要继续启动?" & vbCrLf & vbCrLf & _
                    "提示: 可以在 " & EnvFile & " 中配置", _
                    vbYesNo + vbQuestion, "AI需求分析系统 - 配置确认")
    If Result = vbNo Then
        WScript.Quit 0
    End If
End If

' ---------- 检查并安装后端依赖 ----------
Dim BackendDepsInstalled
BackendDepsInstalled = CheckPythonDeps()
If Not BackendDepsInstalled Then
    WshShell.Run "cmd /c cd /d """ & BackendDir & """ && python -m pip install -r requirements.txt >nul 2>&1", 0, True
End If

' ---------- 检查并安装前端依赖 ----------
Dim NodeModules
NodeModules = FSO.BuildPath(FrontendDir, "node_modules")
If Not FSO.FolderExists(NodeModules) Then
    WshShell.Run "cmd /c cd /d """ & FrontendDir & """ && npm install >nul 2>&1", 0, True
End If

' ---------- 启动后端 ----------
WshShell.Run "cmd /c cd /d """ & BackendDir & """ && python -m uvicorn app.main:app --host 0.0.0.0 --port " & BackendPort, 0, False

' ---------- 等待后端就绪 ----------
WScript.Sleep 5000

' ---------- 启动前端 ----------
WshShell.Run "cmd /c cd /d """ & FrontendDir & """ && npm run dev", 0, False

' ---------- 等待前端就绪 ----------
WScript.Sleep 5000

' ---------- 打开浏览器 ----------
WshShell.Run "http://localhost:" & FrontendPort, 1, False

' ---------- 提示用户 ----------
MsgBox "AI需求分析系统已启动！" & vbCrLf & vbCrLf & _
       "前端界面: http://localhost:" & FrontendPort & vbCrLf & _
       "API文档:  http://localhost:" & BackendPort & "/docs" & vbCrLf & vbCrLf & _
       "提示: 服务在后台运行，关闭此窗口不会影响服务。" & vbCrLf & _
       "需要停止服务时，请在任务管理器中结束 Python 和 Node.js 进程。", _
       vbInformation, "AI需求分析系统 - 启动成功"

' ---------- 清理 ----------
Set WshShell = Nothing
Set FSO = Nothing

WScript.Quit 0

' ============================================================
' 辅助函数
' ============================================================

Function CheckCommand(cmd)
    Dim tempFile, result
    tempFile = FSO.GetTempName
    WshShell.Run "cmd /c " & cmd & " --version > """ & tempFile & """ 2>&1", 0, True
    CheckCommand = FSO.FileExists(tempFile) And FSO.GetFile(tempFile).Size > 0
    On Error Resume Next
    FSO.DeleteFile tempFile, True
    On Error GoTo 0
End Function

Function CheckApiKey(envPath)
    Dim file, line
    CheckApiKey = False
    If Not FSO.FileExists(envPath) Then Exit Function
    Set file = FSO.OpenTextFile(envPath, 1)
    Do While Not file.AtEndOfStream
        line = file.ReadLine
        If InStr(line, "OPENAI_API_KEY=sk-") > 0 And InStr(line, "your_") = 0 Then
            CheckApiKey = True
            Exit Do
        End If
    Loop
    file.Close
    Set file = Nothing
End Function

Function CheckPythonDeps()
    Dim tempFile
    tempFile = FSO.GetTempName
    WshShell.Run "cmd /c python -c ""import fastapi, uvicorn, pydantic, openai, httpx"" > """ & tempFile & """ 2>&1", 0, True
    CheckPythonDeps = (FSO.FileExists(tempFile) And FSO.GetFile(tempFile).Size = 0)
    On Error Resume Next
    FSO.DeleteFile tempFile, True
    On Error GoTo 0
End Function
