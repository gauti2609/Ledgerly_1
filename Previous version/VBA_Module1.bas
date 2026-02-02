Attribute VB_Name = "Module1"
' VBA Code for Financials_Automation_Tool.xlsm - BUILD v52 (REVISED & CORRECTED)
'
' CHANGE LOG (from base v52 provided by user):
' 1. [FIX] Replaced direct list writing in `Setup_CommonControlSheet` with a new `WriteUniqueList` helper subroutine to prevent duplicate values in control lists.
' 2. [ADD] Implemented data validation dropdowns on the `Input_Related_Party_Txns` sheet for 'Relationship' and 'Transaction Type' columns.
' 3. [ADD] Corrected `Apply_Conditional_Formatting` to highlight pasted data in 'Major Head', 'Minor Head', or 'Grouping' columns of the Trial Balance if the entry is not in the master lists.
' 4. [OPTIMIZE] Replaced the original `Setup_InputLedgerSheets` with a corrected version that applies formulas to only the first 50 data rows (A2:I51) in the Receivables and Payables ledgers to improve performance.
' 5. [FIX] Corrected `Setup_InputTrialBalanceSheet` to ensure data validation dropdowns are applied correctly during initial setup by temporarily adding/removing a table row.
' 6. [ADD] New `Validate_Trial_Balance_Data` macro and a corresponding button on the `Input_Trial_Balance` sheet to re-apply conditional formatting after pasting data.

Option Explicit

'================================================================================================'
' GLOBAL DEBUG FLAG
'================================================================================================'
Public Const g_DebugMode As Boolean = True

'================================================================================================'
' SECTION 1: ONE-CLICK SETUP & MAIN BUTTON MACROS
'================================================================================================'

Public Sub Final_Setup_And_Button_Creation()
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Debug.Print "START: Final_Setup_And_Button_Creation"
    On Error GoTo GlobalErrorHandler
    
    Call Setup_Complete_Workbook
    
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Debug.Print "SUCCESS: Final_Setup_And_Button_Creation"
    Exit Sub
GlobalErrorHandler:
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Debug.Print "CRITICAL FAILURE in Final_Setup_And_Button_Creation. Error: " & Err.Description
    MsgBox "A critical, unhandled error occurred. Debugging is required." & vbCrLf & "Error: " & Err.Description, vbCritical
End Sub

Public Sub Create_Control_Button(ByVal ws As Worksheet)
    Dim btn As Button
    Debug.Print "  -> START: Create_Control_Button"
    On Error GoTo ButtonCreationError
    
    If ws Is Nothing Then
        Debug.Print "  -> FAILED: Create_Control_Button - Worksheet object not provided."
        MsgBox "Create_Control_Button failed: The control sheet object was not provided.", vbCritical
        Exit Sub
    End If
    
    On Error Resume Next
    ws.Shapes("btnGenerateFinancials").Delete
    On Error GoTo ButtonCreationError
    
    Set btn = ws.Buttons.Add(ws.Range("A13").Left, ws.Range("A13").Top, 100, 40)
    With btn
        .OnAction = "Refresh_Financials"
        .Caption = "Refresh Financials"
        .Name = "btnGenerateFinancials"
        .Font.Name = "Bookman Old Style"
        .Font.Size = 11
        .Font.Bold = True
    End With
    
    Debug.Print "  -> SUCCESS: Create_Control_Button"
    Exit Sub

ButtonCreationError:
    Debug.Print "  -> FAILED: Create_Control_Button. Error: " & Err.Description
    MsgBox "An unexpected error occurred while creating the control button: " & vbCrLf & Err.Description, vbCritical
End Sub

Public Sub Validate_Trial_Balance_Data()
    ' The conditional formatting is now permanent at the column level.
    ' This button's only job is to force the sheet to recalculate and refresh.
    ThisWorkbook.Sheets("Input_Trial_Balance").Calculate
    
    MsgBox "Validation check complete. Invalid entries should be highlighted in red.", vbInformation
End Sub
Public Sub Create_Validation_Button(ByVal ws As Worksheet)
    Dim btn As Button
    On Error GoTo ButtonCreationError
    
    If ws Is Nothing Then Exit Sub
    
    ' Remove old button if it exists
    On Error Resume Next
    ws.Shapes("btnValidateData").Delete
    On Error GoTo ButtonCreationError
    
    ' Add new button
    Set btn = ws.Buttons.Add(ws.Range("L2").Left, ws.Range("L2").Top, 100, 30)
    With btn
        .OnAction = "Validate_Trial_Balance_Data"
        .Caption = "Validate Pasted Data"
        .Name = "btnValidateData"
        .Font.Name = "Bookman Old Style"
        .Font.Size = 10
    End With
    
    Exit Sub

ButtonCreationError:
    MsgBox "An error occurred while creating the validation button: " & vbCrLf & Err.Description, vbCritical
End Sub

'================================================================================================'
' SECTION 2: REFRESH & GENERATION ORCHESTRATORS
'================================================================================================'

Public Sub Refresh_Financials()
    Debug.Print "START: Refresh_Financials"
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    On Error GoTo GenerationError
    
    Call Update_System_Recommendations
    Call Generate_Notes_To_Accounts
    Call Link_Note_Numbers_To_Statements
    
    Application.Calculation = xlCalculationAutomatic
    Application.CalculateFull
    Application.ScreenUpdating = True
    Debug.Print "SUCCESS: Refresh_Financials"
    MsgBox "Financials have been refreshed successfully.", vbInformation
    ThisWorkbook.Sheets("Balance_Sheet").Activate
    Exit Sub
GenerationError:
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Debug.Print "FAILED: Refresh_Financials. Error: " & Err.Description
    MsgBox "An error occurred while refreshing the financials: " & vbCrLf & Err.Description, vbCritical
End Sub

Public Sub Full_Generate_Financial_Statements()
    Debug.Print "  -> START: Full_Generate_Financial_Statements"
    On Error GoTo FullGenerationError
    Application.ScreenUpdating = False
    
    Call Generate_BalanceSheet_Layout
    Call Generate_PL_Layout
    Call Generate_CashFlow_Layout
    Call Update_System_Recommendations
    Call Generate_Notes_To_Accounts
    Call Link_Note_Numbers_To_Statements
    Call Generate_Ratio_Analysis_Layout
    Call Generate_Aging_Schedules_Layout
    
    Application.ScreenUpdating = True
    Debug.Print "  -> SUCCESS: Full_Generate_Financial_Statements"
    Exit Sub
FullGenerationError:
    Application.ScreenUpdating = True
    Debug.Print "  -> FAILED: Full_Generate_Financial_Statements. Error: " & Err.Description
    MsgBox "An error occurred during the full generation: " & vbCrLf & Err.Description, vbCritical
End Sub

'================================================================================================'
' SECTION 3: DETAILED GENERATION & SETUP SUBROUTINES
'================================================================================================'

Private Sub Setup_Complete_Workbook()
    Dim currentStep As String
    Debug.Print "-> START: Setup_Complete_Workbook"
    On Error GoTo SetupError
    
    Application.DisplayAlerts = False
    
    currentStep = "deleting existing sheets"
    Dim ws As Worksheet, tempSheetName As String: tempSheetName = "TempSetupSheet"
    On Error Resume Next
    ThisWorkbook.Sheets(tempSheetName).Delete
    On Error GoTo SetupError
    ThisWorkbook.Sheets.Add.Name = tempSheetName
    For Each ws In ThisWorkbook.Worksheets
        If ws.Name <> tempSheetName Then ws.Delete
    Next ws

    currentStep = "creating new sheets"
    Dim sheetNames As Variant, i As Integer
    sheetNames = Array("Common_Control_Sheet", "Input_Trial_Balance", "Input_Share_Capital", "Input_PPE_Schedule", "Input_CWIP_Schedule", "Input_Intangible_Schedule", "Input_Investments", "Input_Employee_Benefits", "Input_Taxes", "Input_Related_Party_Txns", "Input_Contingent_Liab", "Input_Receivables_Ledger", "Input_Payables_Ledger", "Selection_Sheet", "Balance_Sheet", "Statement_of_PL", "Cash_Flow_Statement", "Notes_to_Accounts", "Ratio_Analysis", "Aging_Schedules")
    
    ThisWorkbook.Sheets(tempSheetName).Name = sheetNames(0)
    For i = 1 To UBound(sheetNames)
        ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count)).Name = sheetNames(i)
    Next i
    DoEvents

    Dim wsControl As Worksheet: Set wsControl = ThisWorkbook.Sheets("Common_Control_Sheet")
    Dim wsInputTB As Worksheet: Set wsInputTB = ThisWorkbook.Sheets("Input_Trial_Balance")
    Dim wsInputSC As Worksheet: Set wsInputSC = ThisWorkbook.Sheets("Input_Share_Capital")
    Dim wsInputPPE As Worksheet: Set wsInputPPE = ThisWorkbook.Sheets("Input_PPE_Schedule")
    Dim wsInputCWIP As Worksheet: Set wsInputCWIP = ThisWorkbook.Sheets("Input_CWIP_Schedule")
    Dim wsInputIntangible As Worksheet: Set wsInputIntangible = ThisWorkbook.Sheets("Input_Intangible_Schedule")
    Dim wsInputInvest As Worksheet: Set wsInputInvest = ThisWorkbook.Sheets("Input_Investments")
    Dim wsInputEB As Worksheet: Set wsInputEB = ThisWorkbook.Sheets("Input_Employee_Benefits")
    Dim wsInputTax As Worksheet: Set wsInputTax = ThisWorkbook.Sheets("Input_Taxes")
    Dim wsInputRP As Worksheet: Set wsInputRP = ThisWorkbook.Sheets("Input_Related_Party_Txns")
    Dim wsInputCL As Worksheet: Set wsInputCL = ThisWorkbook.Sheets("Input_Contingent_Liab")
    Dim wsSelect As Worksheet: Set wsSelect = ThisWorkbook.Sheets("Selection_Sheet")

    currentStep = "setting up Common_Control_Sheet": Call Setup_CommonControlSheet(wsControl)
    currentStep = "creating dynamic Named Ranges": Call Create_Dynamic_Named_Ranges(wsControl)
    currentStep = "setting up Input_Trial_Balance sheet": Call Setup_InputTrialBalanceSheet(wsInputTB)
    currentStep = "setting up Input_Share_Capital sheet": Call Setup_InputShareCapitalSheet(wsInputSC)
    currentStep = "setting up Input PPE Schedule sheet": Call Setup_InputPPEScheduleSheet(wsInputPPE)
    currentStep = "setting up Input CWIP Schedule sheet": Call Setup_InputCWIPScheduleSheet(wsInputCWIP)
    currentStep = "setting up Input Intangible Schedule sheet": Call Setup_InputIntangibleScheduleSheet(wsInputIntangible)
    currentStep = "setting up Input Investments sheet": Call Setup_InputInvestmentsSheet(wsInputInvest)
    currentStep = "setting up Input Employee Benefits sheet": Call Setup_InputEmployeeBenefitsSheet(wsInputEB)
    currentStep = "setting up Input Taxes sheet": Call Setup_InputTaxesSheet(wsInputTax)
    currentStep = "setting up Input Related Party sheet": Call Setup_InputRelatedPartySheet(wsInputRP)
    currentStep = "setting up Input Contingent Liability sheet": Call Setup_InputContingentLiabSheet(wsInputCL)
    currentStep = "setting up Input Ledger sheets": Call Setup_InputLedgerSheets
    currentStep = "setting up Selection_Sheet": Call Setup_SelectionSheet(wsSelect)
    currentStep = "setting up financial statement headers": Call Setup_FinancialStatementSheets(wsControl)
    currentStep = "running Full_Generate_Financial_Statements": Call Full_Generate_Financial_Statements
    currentStep = "applying conditional formatting": Call Apply_Conditional_Formatting(wsInputTB)
    currentStep = "setting default font": Call Set_Default_Font(wsControl)
    currentStep = "creating the main control button": Call Create_Control_Button(wsControl)
    currentStep = "creating the validation button": Call Create_Validation_Button(wsInputTB)
    
    currentStep = "finalizing setup"
    wsControl.Activate
    Application.DisplayAlerts = True
    
    Debug.Print "-> SUCCESS: Setup_Complete_Workbook"
    MsgBox "Definitive setup is complete.", vbInformation
    Exit Sub

SetupError:
    Application.DisplayAlerts = True
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Debug.Print "-> FAILED: Setup_Complete_Workbook at step '" & currentStep & "'. Error: " & Err.Description
    MsgBox "A critical error occurred during setup." & vbCrLf & "Failed at step: '" & currentStep & "'." & vbCrLf & "Error: " & Err.Description, vbCritical
End Sub

Private Sub Create_Dynamic_Named_Ranges(ByVal ws As Worksheet)
    On Error GoTo RangeError
    Dim wb As Workbook
    Set wb = ThisWorkbook
    wb.Names.Add Name:="MajorHeads", RefersTo:="=OFFSET('" & ws.Name & "'!$C$2,0,0,MAX(1,COUNTA('" & ws.Name & "'!$C:$C)-1),1)"
    wb.Names.Add Name:="MinorHeads", RefersTo:="=OFFSET('" & ws.Name & "'!$D$2,0,0,MAX(1,COUNTA('" & ws.Name & "'!$D:$D)-1),1)"
    wb.Names.Add Name:="Groupings", RefersTo:="=OFFSET('" & ws.Name & "'!$E$2,0,0,MAX(1,COUNTA('" & ws.Name & "'!$E:$E)-1),1)"
    wb.Names.Add Name:="RelatedParties", RefersTo:="=OFFSET('" & ws.Name & "'!$G$2,0,0,MAX(1,COUNTA('" & ws.Name & "'!$G:$G)-1),1)"
    wb.Names.Add Name:="RPTransactionTypes", RefersTo:="=OFFSET('" & ws.Name & "'!$H$2,0,0,MAX(1,COUNTA('" & ws.Name & "'!$H:$H)-1),1)"
    Exit Sub
RangeError:
    Debug.Print "    --> FAILED: Create_Dynamic_Named_Ranges. Error: " & Err.Description
End Sub

Private Sub Apply_Conditional_Formatting(ByVal wsTB As Worksheet)
    On Error GoTo FormatError
    Dim tbl As ListObject
    Dim lastRow As Long
    
    ' Get the table object
    On Error Resume Next
    Set tbl = wsTB.ListObjects("tblTrialBalance")
    If tbl Is Nothing Then Exit Sub ' Exit if table doesn't exist
    On Error GoTo FormatError
    
    lastRow = wsTB.Cells(wsTB.Rows.Count, "G").End(xlUp).Row
    If lastRow < 2 Then lastRow = 2 ' Ensure at least one row
    
    ' --- NEW APPROACH: Apply rules to the entire column, making them independent of cell pasting ---
    
    ' Clear existing rules from the specific columns to avoid conflicts
    wsTB.Columns("G:J").FormatConditions.Delete

    ' Rule for Major Head (Column H)
    With wsTB.Columns("H").FormatConditions.Add(Type:=xlExpression, Formula1:="=AND(H1<>"""", ROW(H1)>1, COUNTIF(MajorHeads,H1)=0)")
        .Interior.Color = RGB(255, 199, 206)
    End With
    
    ' Rule for Minor Head (Column I)
    With wsTB.Columns("I").FormatConditions.Add(Type:=xlExpression, Formula1:="=AND(I1<>"""", ROW(I1)>1, COUNTIF(MinorHeads,I1)=0)")
        .Interior.Color = RGB(255, 199, 206)
    End With
    
    ' Rule for Grouping (Column J)
    With wsTB.Columns("J").FormatConditions.Add(Type:=xlExpression, Formula1:="=AND(J1<>"""", ROW(J1)>1, COUNTIF(Groupings,J1)=0)")
        .Interior.Color = RGB(255, 199, 206)
    End With
    
    Debug.Print "  -> SUCCESS: Apply_Conditional_Formatting"
    Exit Sub
FormatError:
    Debug.Print "  -> FAILED: Apply_Conditional_Formatting. Error: " & Err.Description
End Sub
Private Sub Generate_BalanceSheet_Layout()
    On Error GoTo LayoutError
    Dim ws As Worksheet, r As Long, cyCol As String, pyCol As String
    Set ws = ThisWorkbook.Sheets("Balance_Sheet")
    cyCol = "C": pyCol = "D"
    
    ws.Range("A7:E1000").Clear: ws.Range("A7:E1000").ClearFormats
    ws.Columns("A").ColumnWidth = 50: ws.Columns("B").ColumnWidth = 10: ws.Columns(cyCol).ColumnWidth = 30: ws.Columns(pyCol).ColumnWidth = 30
    ws.Range("A7:" & pyCol & "7").Value = Array("Particulars", "Note No.", "Figures as at the end of current reporting period", "Figures as at the end of previous reporting period")
    ws.Range("A7:" & pyCol & "7").Font.Bold = True
    r = 8
    ws.Range("A" & r).Value = "I. ASSETS": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "(1) Non-current assets": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "   (a) Property, Plant and Equipment": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Property, Plant and Equipment"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Property, Plant and Equipment"")": r = r + 1
    ws.Range("A" & r).Value = "   (b) Intangible assets": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Intangible Assets"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Intangible Assets"")": r = r + 1
    ws.Range("A" & r).Value = "   (c) Non-current investments": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Non-current Investments"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Non-current Investments"")": r = r + 1
    ws.Range("A" & r).Value = "   (d) Long-term loans and advances": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Long-term Loans and Advances"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Long-term Loans and Advances"")": r = r + 1
    ws.Range("A" & r).Value = "   (e) Other non-current assets": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Other Non-current Assets"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Other Non-current Assets"")": r = r + 1
    ws.Range("A" & r).Value = "Total Non-current assets": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=SUM(" & cyCol & r - 5 & ":" & cyCol & r - 1 & ")": ws.Range(pyCol & r).Formula = "=SUM(" & pyCol & r - 5 & ":" & pyCol & r - 1 & ")": r = r + 2
    ws.Range("A" & r).Value = "(2) Current assets": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "   (a) Current investments": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Current Investments"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Current Investments"")": r = r + 1
    ws.Range("A" & r).Value = "   (b) Inventories": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Inventories"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Inventories"")": r = r + 1
    ws.Range("A" & r).Value = "   (c) Trade receivables": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Trade Receivables"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Trade Receivables"")": r = r + 1
    ws.Range("A" & r).Value = "   (d) Cash and cash equivalents": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Cash and Cash Equivalents"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Cash and Cash Equivalents"")": r = r + 1
    ws.Range("A" & r).Value = "   (e) Short-term loans and advances": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Short-term Loans and Advances"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Short-term Loans and Advances"")": r = r + 1
    ws.Range("A" & r).Value = "   (f) Other current assets": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Other Current Assets"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Other Current Assets"")": r = r + 1
    ws.Range("A" & r).Value = "Total Current assets": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=SUM(" & cyCol & r - 6 & ":" & cyCol & r - 1 & ")": ws.Range(pyCol & r).Formula = "=SUM(" & pyCol & r - 6 & ":" & pyCol & r - 1 & ")": r = r + 1
    ws.Range("A" & r).Value = "TOTAL ASSETS": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=" & cyCol & r - 8 & "+" & cyCol & r - 1 & "": ws.Range(pyCol & r).Formula = "=" & pyCol & r - 8 & "+" & pyCol & r - 1 & "": ws.Range("A" & r & ":" & pyCol & r).Borders(xlEdgeTop).LineStyle = xlContinuous: r = r + 2
    ws.Range("A" & r).Value = "II. EQUITY AND LIABILITIES": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "(1) Equity": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "   (a) Equity Share Capital": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Equity Share Capital"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Equity Share Capital"")": r = r + 1
    ws.Range("A" & r).Value = "   (b) Other Equity": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Other Equity"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Other Equity"")": r = r + 1
    ws.Range("A" & r).Value = "Total Equity": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=SUM(" & cyCol & r - 2 & ":" & cyCol & r - 1 & ")": ws.Range(pyCol & r).Formula = "=SUM(" & pyCol & r - 2 & ":" & pyCol & r - 1 & ")": r = r + 2
    ws.Range("A" & r).Value = "(2) Liabilities": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "Non-current liabilities": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "   (a) Long-term borrowings": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Long-term Borrowings"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Long-term Borrowings"")": r = r + 1
    ws.Range("A" & r).Value = "   (b) Deferred tax liabilities (Net)": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Deferred Tax Liabilities (Net)"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Deferred Tax Liabilities (Net)"")": r = r + 1
    ws.Range("A" & r).Value = "   (c) Other long-term liabilities": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Other Long-term Liabilities"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Other Long-term Liabilities"")": r = r + 1
    ws.Range("A" & r).Value = "   (d) Long-term provisions": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Long-term Provisions"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Long-term Provisions"")": r = r + 1
    ws.Range("A" & r).Value = "Total Non-current liabilities": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=SUM(" & cyCol & r - 4 & ":" & cyCol & r - 1 & ")": ws.Range(pyCol & r).Formula = "=SUM(" & pyCol & r - 4 & ":" & pyCol & r - 1 & ")": r = r + 2
    ws.Range("A" & r).Value = "Current liabilities": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "   (a) Short-term borrowings": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Short-term Borrowings"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Short-term Borrowings"")": r = r + 1
    ws.Range("A" & r).Value = "   (b) Trade payables": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Trade Payables"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Trade Payables"")": r = r + 1
    ws.Range("A" & r).Value = "   (c) Other current liabilities": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Other Current Liabilities"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Other Current Liabilities"")": r = r + 1
    ws.Range("A" & r).Value = "   (d) Short-term provisions": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Short-term Provisions"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Short-term Provisions"")": r = r + 1
    ws.Range("A" & r).Value = "Total Current liabilities": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=SUM(" & cyCol & r - 4 & ":" & cyCol & r - 1 & ")": ws.Range(pyCol & r).Formula = "=SUM(" & pyCol & r - 4 & ":" & pyCol & r - 1 & ")": r = r + 1
    ws.Range("A" & r).Value = "TOTAL EQUITY AND LIABILITIES": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=" & cyCol & r - 13 & "+" & cyCol & r - 7 & "+" & cyCol & r - 1 & "": ws.Range(pyCol & r).Formula = "=" & pyCol & r - 13 & "+" & pyCol & r - 7 & "+" & pyCol & r - 1 & "": ws.Range("A" & r & ":" & pyCol & r).Borders(xlEdgeTop).LineStyle = xlContinuous
    ws.Range(cyCol & "8:" & pyCol & r).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    Exit Sub
LayoutError:
    Debug.Print "    --> FAILED: Generate_BalanceSheet_Layout. Error: " & Err.Description
End Sub

Private Sub Generate_PL_Layout()
    On Error GoTo LayoutError
    Dim ws As Worksheet, r As Long, cyCol As String, pyCol As String
    Set ws = ThisWorkbook.Sheets("Statement_of_PL")
    cyCol = "C": pyCol = "D"
    
    ws.Range("A7:E1000").Clear: ws.Range("A7:E1000").ClearFormats
    ws.Columns("A").ColumnWidth = 60: ws.Columns("B").ColumnWidth = 10: ws.Columns(cyCol).ColumnWidth = 30: ws.Columns(pyCol).ColumnWidth = 30
    ws.Range("A7:" & pyCol & "7").Value = Array("Particulars", "Note No.", "Figures for the current reporting period", "Figures for the previous reporting period")
    ws.Range("A7:" & pyCol & "7").Font.Bold = True
    r = 8
    ws.Range("A" & r).Value = "I. Revenue from operations": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Revenue from Operations"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Revenue from Operations"")": r = r + 1
    ws.Range("A" & r).Value = "II. Other income": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Other Income"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Other Income"")": r = r + 1
    ws.Range("A" & r).Value = "III. Total Income": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=SUM(" & cyCol & r - 2 & ":" & cyCol & r - 1 & ")": ws.Range(pyCol & r).Formula = "=SUM(" & pyCol & r - 2 & ":" & pyCol & r - 1 & ")": ws.Range("A" & r & ":" & pyCol & r).Borders(xlEdgeTop).LineStyle = xlContinuous: r = r + 2
    ws.Range("A" & r).Value = "IV. EXPENSES": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "   Cost of materials consumed": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Cost of Materials Consumed"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Cost of Materials Consumed"")": r = r + 1
    ws.Range("A" & r).Value = "   Purchases of Stock-in-Trade": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Purchases of Stock-in-Trade"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Purchases of Stock-in-Trade"")": r = r + 1
    ws.Range("A" & r).Value = "   Changes in inventories of finished goods, work-in-progress and Stock-in-Trade": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Changes in Inventories"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Changes in Inventories"")": r = r + 1
    ws.Range("A" & r).Value = "   Employee benefits expense": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Employee Benefits Expense"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Employee Benefits Expense"")": r = r + 1
    ws.Range("A" & r).Value = "   Finance costs": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Finance Costs"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Finance Costs"")": r = r + 1
    ws.Range("A" & r).Value = "   Depreciation and amortization expense": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Depreciation and Amortization"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Depreciation and Amortization"")": r = r + 1
    ws.Range("A" & r).Value = "   Other expenses": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Other Expenses"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Other Expenses"")": r = r + 1
    ws.Range("A" & r).Value = "Total expenses": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=SUM(" & cyCol & r - 7 & ":" & cyCol & r - 1 & ")": ws.Range(pyCol & r).Formula = "=SUM(" & pyCol & r - 7 & ":" & pyCol & r - 1 & ")": ws.Range("A" & r & ":" & pyCol & r).Borders(xlEdgeTop).LineStyle = xlContinuous: r = r + 2
    ws.Range("A" & r).Value = "V. Profit before exceptional and extraordinary items and tax (III - IV)": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=" & cyCol & r - 10 & "-" & cyCol & r - 1 & "": ws.Range(pyCol & r).Formula = "=" & pyCol & r - 10 & "-" & pyCol & r - 1 & "": r = r + 1
    ws.Range("A" & r).Value = "VI. Exceptional items": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Exceptional Items"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Exceptional Items"")": r = r + 1
    ws.Range("A" & r).Value = "VII. Profit before extraordinary items and tax (V - VI)": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=" & cyCol & r - 2 & "-" & cyCol & r - 1 & "": ws.Range(pyCol & r).Formula = "=" & pyCol & r - 2 & "-" & pyCol & r - 1 & "": r = r + 1
    ws.Range("A" & r).Value = "VIII. Extraordinary Items": ws.Range(cyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Extraordinary Items"")": ws.Range(pyCol & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Extraordinary Items"")": r = r + 1
    ws.Range("A" & r).Value = "IX. Profit before tax (VII - VIII)": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=" & cyCol & r - 2 & "-" & cyCol & r - 1 & "": ws.Range(pyCol & r).Formula = "=" & pyCol & r - 2 & "-" & pyCol & r - 1 & "": r = r + 1
    ws.Range("A" & r).Value = "X. Tax expense:": ws.Range(cyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Taxes on Income"")": ws.Range(pyCol & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Taxes on Income"")": r = r + 1
    ws.Range("A" & r).Value = "XI. Profit (Loss) for the period from continuing operations (IX - X)": ws.Range("A" & r, cyCol & r).Font.Bold = True: ws.Range(cyCol & r).Formula = "=" & cyCol & r - 2 & "-" & cyCol & r - 1 & "": ws.Range(pyCol & r).Formula = "=" & pyCol & r - 2 & "-" & pyCol & r - 1 & "": r = r + 2
    ws.Range("A" & r).Value = "XII. Earnings per equity share (for continuing operation):": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "   (1) Basic": r = r + 1
    ws.Range("A" & r).Value = "   (2) Diluted"
    ws.Range(cyCol & "8:" & pyCol & r).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    Exit Sub
LayoutError:
    Debug.Print "    --> FAILED: Generate_PL_Layout. Error: " & Err.Description
End Sub

Private Sub Generate_CashFlow_Layout()
    On Error GoTo LayoutError
    Dim ws As Worksheet, r As Long, pbt_cell As Range
    Dim pbt_address_cy As String, pbt_address_py As String
    Set ws = ThisWorkbook.Sheets("Cash_Flow_Statement")
    
    ' Find PBT cell and create addresses for CY and PY
    Set pbt_cell = ThisWorkbook.Sheets("Statement_of_PL").Range("A1:A100").Find("Profit before tax", LookIn:=xlFormulas, lookat:=xlPart)
    If pbt_cell Is Nothing Then
        pbt_address_cy = "0": pbt_address_py = "0"
    Else
        pbt_address_cy = "'Statement_of_PL'!" & pbt_cell.Offset(0, 2).Address(False, False)
        pbt_address_py = "'Statement_of_PL'!" & pbt_cell.Offset(0, 3).Address(False, False)
    End If

    ws.Range("A7:D1000").Clear: ws.Range("A7:D1000").ClearFormats
    ws.Columns("A").ColumnWidth = 60: ws.Columns("B").ColumnWidth = 30: ws.Columns("C").ColumnWidth = 30
    ws.Range("A7:C7").Value = Array("Particulars", "Current Year", "Previous Year")
    ws.Range("A7:C7").Font.Bold = True
    r = 8
    ws.Range("A" & r).Value = "A. Cash flow from operating activities": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "Net profit before tax": ws.Range("B" & r).Formula = "=" & pbt_address_cy: ws.Range("C" & r).Formula = "=" & pbt_address_py: r = r + 1
    ws.Range("A" & r).Value = "Adjustments for:": r = r + 1
    ws.Range("A" & r).Value = "   Depreciation and amortization expense": ws.Range("B" & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Depreciation and Amortization"")": ws.Range("C" & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Depreciation and Amortization"")": r = r + 1
    ws.Range("A" & r).Value = "   Finance costs": ws.Range("B" & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Finance Costs"")": ws.Range("C" & r).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Finance Costs"")": r = r + 1
    ws.Range("A" & r).Value = "   Interest income": ws.Range("B" & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Grouping], ""Interest Income"")": ws.Range("C" & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Grouping], ""Interest Income"")": r = r + 1
    ws.Range("A" & r).Value = "Operating profit before working capital changes": ws.Range("A" & r, "B" & r).Font.Bold = True: ws.Range("B" & r).Formula = "=SUM(B" & r - 4 & ":B" & r - 1 & ")": ws.Range("C" & r).Formula = "=SUM(C" & r - 4 & ":C" & r - 1 & ")": r = r + 2
    ws.Range("A" & r).Value = "Adjustments for changes in working capital:": r = r + 1
    ws.Range("A" & r).Value = "   (Increase)/Decrease in Trade Receivables": ws.Range("B" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Trade Receivables"",tblTrialBalance[Opening Balance (CY)])-SUMIF(tblTrialBalance[Major Head],""Trade Receivables"",tblTrialBalance[Closing Balance (CY)]))": ws.Range("C" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Trade Receivables"",tblTrialBalance[Closing Balance (PY)])-SUMIF(tblTrialBalance[Major Head],""Trade Receivables"",tblTrialBalance[Opening Balance (CY)]))": r = r + 1
    ws.Range("A" & r).Value = "   (Increase)/Decrease in Inventories": ws.Range("B" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Inventories"",tblTrialBalance[Opening Balance (CY)])-SUMIF(tblTrialBalance[Major Head],""Inventories"",tblTrialBalance[Closing Balance (CY)]))": ws.Range("C" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Inventories"",tblTrialBalance[Closing Balance (PY)])-SUMIF(tblTrialBalance[Major Head],""Inventories"",tblTrialBalance[Opening Balance (CY)]))": r = r + 1
    ws.Range("A" & r).Value = "   Increase/(Decrease) in Trade Payables": ws.Range("B" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Trade Payables"",tblTrialBalance[Closing Balance (CY)])-SUMIF(tblTrialBalance[Major Head],""Trade Payables"",tblTrialBalance[Opening Balance (CY)]))": ws.Range("C" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Trade Payables"",tblTrialBalance[Opening Balance (CY)])-SUMIF(tblTrialBalance[Major Head],""Trade Payables"",tblTrialBalance[Closing Balance (PY)]))": r = r + 1
    ws.Range("A" & r).Value = "Cash generated from operations": ws.Range("A" & r, "B" & r).Font.Bold = True: ws.Range("B" & r).Formula = "=SUM(B" & r - 4 & ":B" & r - 1 & ")": ws.Range("C" & r).Formula = "=SUM(C" & r - 4 & ":C" & r - 1 & ")": r = r + 1
    ws.Range("A" & r).Value = "   Direct taxes paid": ws.Range("B" & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Taxes on Income"")": ws.Range("C" & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Taxes on Income"")": r = r + 1
    ws.Range("A" & r).Value = "Net cash from operating activities": ws.Range("A" & r, "B" & r).Font.Bold = True: ws.Range("B" & r).Formula = "=B" & r - 2 & "+B" & r - 1 & "": ws.Range("C" & r).Formula = "=C" & r - 2 & "+C" & r - 1 & "": r = r + 2
    ws.Range("A" & r).Value = "B. Cash flow from investing activities": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "   Purchase of Property, Plant and Equipment": ws.Range("B" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Property, Plant and Equipment"",tblTrialBalance[Opening Balance (CY)])-SUMIF(tblTrialBalance[Major Head],""Property, Plant and Equipment"",tblTrialBalance[Closing Balance (CY)]))": ws.Range("C" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Property, Plant and Equipment"",tblTrialBalance[Closing Balance (PY)])-SUMIF(tblTrialBalance[Major Head],""Property, Plant and Equipment"",tblTrialBalance[Opening Balance (CY)]))": r = r + 1
    ws.Range("A" & r).Value = "   Interest received": ws.Range("B" & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Grouping], ""Interest Income"")": ws.Range("C" & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Grouping], ""Interest Income"")": r = r + 1
    ws.Range("A" & r).Value = "Net cash from investing activities": ws.Range("A" & r, "B" & r).Font.Bold = True: ws.Range("B" & r).Formula = "=SUM(B" & r - 2 & ":B" & r - 1 & ")": ws.Range("C" & r).Formula = "=SUM(C" & r - 2 & ":C" & r - 1 & ")": r = r + 2
    ws.Range("A" & r).Value = "C. Cash flow from financing activities": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "   Proceeds from issue of Equity Share Capital": ws.Range("B" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Equity Share Capital"",tblTrialBalance[Closing Balance (CY)])-SUMIF(tblTrialBalance[Major Head],""Equity Share Capital"",tblTrialBalance[Opening Balance (CY)]))": ws.Range("C" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Equity Share Capital"",tblTrialBalance[Opening Balance (CY)])-SUMIF(tblTrialBalance[Major Head],""Equity Share Capital"",tblTrialBalance[Closing Balance (PY)]))": r = r + 1
    ws.Range("A" & r).Value = "   Proceeds from Long-term borrowings": ws.Range("B" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Long-term Borrowings"",tblTrialBalance[Closing Balance (CY)])-SUMIF(tblTrialBalance[Major Head],""Long-term Borrowings"",tblTrialBalance[Opening Balance (CY)]))": ws.Range("C" & r).Formula = "=(SUMIF(tblTrialBalance[Major Head],""Long-term Borrowings"",tblTrialBalance[Opening Balance (CY)])-SUMIF(tblTrialBalance[Major Head],""Long-term Borrowings"",tblTrialBalance[Closing Balance (PY)]))": r = r + 1
    ws.Range("A" & r).Value = "   Finance costs paid": ws.Range("B" & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Finance Costs"")": ws.Range("C" & r).Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Finance Costs"")": r = r + 1
    ws.Range("A" & r).Value = "Net cash from financing activities": ws.Range("A" & r, "B" & r).Font.Bold = True: ws.Range("B" & r).Formula = "=SUM(B" & r - 3 & ":B" & r - 1 & ")": ws.Range("C" & r).Formula = "=SUM(C" & r - 3 & ":C" & r - 1 & ")": r = r + 2
    ws.Range("A" & r).Value = "Net increase/(decrease) in cash and cash equivalents (A+B+C)": ws.Range("A" & r, "B" & r).Font.Bold = True: ws.Range("B" & r).Formula = "=B" & r - 11 & "+B" & r - 6 & "+B" & r - 1 & "": ws.Range("C" & r).Formula = "=C" & r - 11 & "+C" & r - 6 & "+C" & r - 1 & "": r = r + 1
    ws.Range("A" & r).Value = "Cash and cash equivalents at the beginning of the year": ws.Range("B" & r).Formula = "=SUMIF(tblTrialBalance[Major Head],""Cash and Cash Equivalents"",tblTrialBalance[Opening Balance (CY)])": ws.Range("C" & r).Formula = "=SUMIF(tblTrialBalance[Major Head],""Cash and Cash Equivalents"",tblTrialBalance[Closing Balance (PY)])": r = r + 1
    ws.Range("A" & r).Value = "Cash and cash equivalents at the end of the year": ws.Range("A" & r, "B" & r).Font.Bold = True: ws.Range("B" & r).Formula = "=SUM(B" & r - 2 & ":B" & r - 1 & ")": ws.Range("C" & r).Formula = "=SUM(C" & r - 2 & ":C" & r - 1 & ")": r = r + 1
    ws.Range("B8:C" & r).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    Exit Sub
LayoutError:
    Debug.Print "    --> FAILED: Generate_CashFlow_Layout. Error: " & Err.Description
End Sub

Private Sub Generate_Ratio_Analysis_Layout()
    On Error GoTo LayoutError
    Dim ws As Worksheet, r As Long, tbl As ListObject
    Set ws = ThisWorkbook.Sheets("Ratio_Analysis")
    ws.Cells.Clear: ws.Cells.ClearFormats
    
    ws.Range("A1").Value = "Ratio Analysis": ws.Range("A1").Font.Bold = True: ws.Range("A1").Font.Size = 14
    
    Dim headers() As Variant
    headers = Array("Ratio Name", "Formula", "Current Year Result", "Previous Year Result", "Variance (%)", "Explanation for Variance > 25%")
    ws.Range("A3").Resize(1, UBound(headers) + 1).Value = headers
    
    On Error Resume Next
    ws.ListObjects("tblRatios").Delete
    On Error GoTo LayoutError
    
    Set tbl = ws.ListObjects.Add(xlSrcRange, ws.Range("A3").CurrentRegion, , xlYes)
    tbl.Name = "tblRatios"
    
    Dim ratioFormulas As Object, key As Variant
    Set ratioFormulas = CreateObject("Scripting.Dictionary")
    ratioFormulas.Add "Current Ratio", "Current Assets / Current Liabilities|=IFERROR(Balance_Sheet!C26/Balance_Sheet!C47, 0)"
    ratioFormulas.Add "Debt to Equity Ratio", "(Long-term Borrowings + Short-term Borrowings) / Total Equity|=IFERROR((Balance_Sheet!C38+Balance_Sheet!C42)/Balance_Sheet!C33, 0)"
    ratioFormulas.Add "Net Profit Ratio", "Net Profit After Tax / Revenue from Operations|=IFERROR(Statement_of_PL!C26/Statement_of_PL!C8, 0)"
    ratioFormulas.Add "Return on Equity (ROE)", "Net Profit After Tax / Total Equity|=IFERROR(Statement_of_PL!C26/Balance_Sheet!C33, 0)"
    ratioFormulas.Add "Return on Capital Employed (ROCE)", "EBIT / (Total Assets - Current Liabilities)|=IFERROR((Statement_of_PL!C24+Statement_of_PL!C16)/(Balance_Sheet!C27-Balance_Sheet!C47), 0)"
    ratioFormulas.Add "Inventory Turnover Ratio", "Cost of Materials Consumed / Closing Inventory|=IFERROR(Statement_of_PL!C12/Balance_Sheet!C20, 0)"
    ratioFormulas.Add "Trade Receivables Turnover Ratio", "Revenue from Operations / Closing Trade Receivables|=IFERROR(Statement_of_PL!C8/Balance_Sheet!C21, 0)"
    
    tbl.DataBodyRange.Delete
    
    For Each key In ratioFormulas.Keys
        Dim newRow As ListRow
        Set newRow = tbl.ListRows.Add
        With newRow
            .Range(1, 1).Value = key
            .Range(1, 2).Value = Split(ratioFormulas(key), "|")(0)
            .Range(1, 3).Formula = Split(ratioFormulas(key), "|")(1)
            .Range(1, 5).Formula = "=IFERROR(([@[Current Year Result]]-[@[Previous Year Result]])/[@[Previous Year Result]],0)"
        End With
    Next key
    
    tbl.ListColumns("Current Year Result").DataBodyRange.NumberFormat = "0.00"
    tbl.ListColumns("Previous Year Result").DataBodyRange.NumberFormat = "0.00"
    tbl.ListColumns("Variance (%)").DataBodyRange.NumberFormat = "0.00%"
    
    With tbl.ListColumns("Variance (%)").DataBodyRange.FormatConditions
        .Add Type:=xlCellValue, Operator:=xlGreaterEqual, Formula1:="0.25"
        .item(1).Interior.Color = RGB(255, 235, 156) ' Light Amber
        .Add Type:=xlCellValue, Operator:=xlLessEqual, Formula1:="-0.25"
        .item(2).Interior.Color = RGB(255, 235, 156) ' Light Amber
    End With
    
    ws.Columns.AutoFit
    ws.Columns("F").ColumnWidth = 50
    Exit Sub
LayoutError:
    Debug.Print "    --> FAILED: Generate_Ratio_Analysis_Layout. Error: " & Err.Description
End Sub

Private Sub Generate_Aging_Schedules_Layout()
    Dim ws As Worksheet, r As Long
    Set ws = ThisWorkbook.Sheets("Aging_Schedules")
    
    ws.Cells.Clear
    
    r = 2
    ws.Range("A" & r).Value = "Trade Receivables Aging Schedule": ws.Range("A" & r).Font.Bold = True: ws.Range("A" & r).Font.Size = 12
    r = r + 2
    
    Dim headers() As Variant
    headers = Array("Particulars", "< 6 Months", "6 Months - 1 Year", "1-2 Years", "2-3 Years", "> 3 Years", "Total")
    ws.Range("A" & r).Resize(1, UBound(headers) + 1).Value = headers
    ws.Range("A" & r, "G" & r).Font.Bold = True
    r = r + 1
    
    ws.Range("A" & r).Value = "Undisputed"
    ws.Range("B" & r).Formula = "=SUMIFS(Input_Receivables_Ledger!$F:$F, Input_Receivables_Ledger!$G:$G, ""No"", Input_Receivables_Ledger!$I:$I, ""< 182 Days"")"
    ws.Range("C" & r).Formula = "=SUMIFS(Input_Receivables_Ledger!$F:$F, Input_Receivables_Ledger!$G:$G, ""No"", Input_Receivables_Ledger!$I:$I, ""182-365 Days"")"
    ws.Range("D" & r).Formula = "=SUMIFS(Input_Receivables_Ledger!$F:$F, Input_Receivables_Ledger!$G:$G, ""No"", Input_Receivables_Ledger!$I:$I, ""1-2 Years"")"
    ws.Range("E" & r).Formula = "=SUMIFS(Input_Receivables_Ledger!$F:$F, Input_Receivables_Ledger!$G:$G, ""No"", Input_Receivables_Ledger!$I:$I, ""2-3 Years"")"
    ws.Range("F" & r).Formula = "=SUMIFS(Input_Receivables_Ledger!$F:$F, Input_Receivables_Ledger!$G:$G, ""No"", Input_Receivables_Ledger!$I:$I, ""> 3 Years"")"
    ws.Range("G" & r).Formula = "=SUM(B" & r & ":F" & r & ")"
    r = r + 1
    
    ws.Range("A" & r).Value = "Disputed"
    ws.Range("B" & r).Formula = "=SUMIFS(Input_Receivables_Ledger!$F:$F, Input_Receivables_Ledger!$G:$G, ""Yes"", Input_Receivables_Ledger!$I:$I, ""< 182 Days"")"
    ws.Range("C" & r).Formula = "=SUMIFS(Input_Receivables_Ledger!$F:$F, Input_Receivables_Ledger!$G:$G, ""Yes"", Input_Receivables_Ledger!$I:$I, ""182-365 Days"")"
    ws.Range("D" & r).Formula = "=SUMIFS(Input_Receivables_Ledger!$F:$F, Input_Receivables_Ledger!$G:$G, ""Yes"", Input_Receivables_Ledger!$I:$I, ""1-2 Years"")"
    ws.Range("E" & r).Formula = "=SUMIFS(Input_Receivables_Ledger!$F:$F, Input_Receivables_Ledger!$G:$G, ""Yes"", Input_Receivables_Ledger!$I:$I, ""2-3 Years"")"
    ws.Range("F" & r).Formula = "=SUMIFS(Input_Receivables_Ledger!$F:$F, Input_Receivables_Ledger!$G:$G, ""Yes"", Input_Receivables_Ledger!$I:$I, ""> 3 Years"")"
    ws.Range("G" & r).Formula = "=SUM(B" & r & ":F" & r & ")"
    r = r + 1
    
    ws.Range("A" & r).Value = "Total": ws.Range("A" & r).Font.Bold = True
    ws.Range("B" & r).Formula = "=SUM(B" & r - 2 & ":B" & r - 1 & ")": ws.Range("B" & r, "G" & r).Font.Bold = True
    ws.Range("C" & r).Formula = "=SUM(C" & r - 2 & ":C" & r - 1 & ")"
    ws.Range("D" & r).Formula = "=SUM(D" & r - 2 & ":D" & r - 1 & ")"
    ws.Range("E" & r).Formula = "=SUM(E" & r - 2 & ":E" & r - 1 & ")"
    ws.Range("F" & r).Formula = "=SUM(F" & r - 2 & ":F" & r - 1 & ")"
    ws.Range("G" & r).Formula = "=SUM(G" & r - 2 & ":G" & r - 1 & ")"
    ws.Range("A" & r, "G" & r).Borders(xlEdgeTop).LineStyle = xlContinuous
    ws.Range("B5:G" & r).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Range("A4:G" & r).Borders.LineStyle = xlContinuous
    
    r = r + 4
    Dim startPayablesRow As Long: startPayablesRow = r
    ws.Range("A" & r).Value = "Trade Payables Aging Schedule": ws.Range("A" & r).Font.Bold = True: ws.Range("A" & r).Font.Size = 12
    r = r + 2
    ws.Range("A" & r).Resize(1, UBound(headers) + 1).Value = headers
    ws.Range("A" & r, "G" & r).Font.Bold = True
    r = r + 1
    
    ws.Range("A" & r).Value = "MSME"
    ws.Range("B" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""MSME"", Input_Payables_Ledger!$I:$I, ""< 182 Days"")"
    ws.Range("C" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""MSME"", Input_Payables_Ledger!$I:$I, ""182-365 Days"")"
    ws.Range("D" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""MSME"", Input_Payables_Ledger!$I:$I, ""1-2 Years"")"
    ws.Range("E" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""MSME"", Input_Payables_Ledger!$I:$I, ""2-3 Years"")"
    ws.Range("F" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""MSME"", Input_Payables_Ledger!$I:$I, ""> 3 Years"")"
    ws.Range("G" & r).Formula = "=SUM(B" & r & ":F" & r & ")"
    r = r + 1
    
    ws.Range("A" & r).Value = "Disputed - Others"
    ws.Range("B" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""Other"", Input_Payables_Ledger!$G:$G, ""Yes"", Input_Payables_Ledger!$I:$I, ""< 182 Days"")"
    ws.Range("C" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""Other"", Input_Payables_Ledger!$G:$G, ""Yes"", Input_Payables_Ledger!$I:$I, ""182-365 Days"")"
    ws.Range("D" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""Other"", Input_Payables_Ledger!$G:$G, ""Yes"", Input_Payables_Ledger!$I:$I, ""1-2 Years"")"
    ws.Range("E" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""Other"", Input_Payables_Ledger!$G:$G, ""Yes"", Input_Payables_Ledger!$I:$I, ""2-3 Years"")"
    ws.Range("F" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""Other"", Input_Payables_Ledger!$G:$G, ""Yes"", Input_Payables_Ledger!$I:$I, ""> 3 Years"")"
    ws.Range("G" & r).Formula = "=SUM(B" & r & ":F" & r & ")"
    r = r + 1
    
    ws.Range("A" & r).Value = "Undisputed - Others"
    ws.Range("B" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""Other"", Input_Payables_Ledger!$G:$G, ""No"", Input_Payables_Ledger!$I:$I, ""< 182 Days"")"
    ws.Range("C" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""Other"", Input_Payables_Ledger!$G:$G, ""No"", Input_Payables_Ledger!$I:$I, ""182-365 Days"")"
    ws.Range("D" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""Other"", Input_Payables_Ledger!$G:$G, ""No"", Input_Payables_Ledger!$I:$I, ""1-2 Years"")"
    ws.Range("E" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""Other"", Input_Payables_Ledger!$G:$G, ""No"", Input_Payables_Ledger!$I:$I, ""2-3 Years"")"
    ws.Range("F" & r).Formula = "=SUMIFS(Input_Payables_Ledger!$F:$F, Input_Payables_Ledger!$H:$H, ""Other"", Input_Payables_Ledger!$G:$G, ""No"", Input_Payables_Ledger!$I:$I, ""> 3 Years"")"
    ws.Range("G" & r).Formula = "=SUM(B" & r & ":F" & r & ")"
    r = r + 1
    
    ws.Range("A" & r).Value = "Total": ws.Range("A" & r).Font.Bold = True
    ws.Range("B" & r).Formula = "=SUM(B" & r - 3 & ":B" & r - 1 & ")": ws.Range("B" & r, "G" & r).Font.Bold = True
    ws.Range("C" & r).Formula = "=SUM(C" & r - 3 & ":C" & r - 1 & ")"
    ws.Range("D" & r).Formula = "=SUM(D" & r - 3 & ":D" & r - 1 & ")"
    ws.Range("E" & r).Formula = "=SUM(E" & r - 3 & ":E" & r - 1 & ")"
    ws.Range("F" & r).Formula = "=SUM(F" & r - 3 & ":F" & r - 1 & ")"
    ws.Range("G" & r).Formula = "=SUM(G" & r - 3 & ":G" & r - 1 & ")"
    ws.Range("A" & r, "G" & r).Borders(xlEdgeTop).LineStyle = xlContinuous
    
    ws.Range("B" & startPayablesRow + 3 & ":G" & r).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Range("A" & startPayablesRow + 2 & ":G" & r).Borders.LineStyle = xlContinuous
    ws.Columns("A:G").AutoFit
End Sub

Private Sub Generate_Notes_To_Accounts()
    On Error GoTo NotesError
    Dim wsNotes As Worksheet, wsSelect As Worksheet, lastRow As Long, i As Integer, notesRow As Long
    Set wsNotes = ThisWorkbook.Sheets("Notes_to_Accounts")
    Set wsSelect = ThisWorkbook.Sheets("Selection_Sheet")
    wsNotes.Range("A7:L1000").Clear: wsNotes.Range("A7:L1000").ClearFormats
    AutoNumber_Selected_Notes
    lastRow = wsSelect.Cells(wsSelect.Rows.Count, "B").End(xlUp).Row
    notesRow = 8
    For i = 2 To lastRow
        If wsSelect.Range("F" & i).Value = "Yes" And Not IsEmpty(wsSelect.Range("G" & i).Value) Then
            Select Case wsSelect.Range("A" & i).Value
                Case "A.2": Call Create_AccountingPolicies_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "B.1": Call Create_ShareCapital_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "B.7": Call Create_EmployeeBenefits_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "C.1": Call Create_PPE_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "C.2": Call Create_CWIP_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "C.3": Call Create_Intangible_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "C.4": Call Create_Investments_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "C.7": Call Create_Cash_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "D.3": Call Create_COGS_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "D.10": Call Create_EPS_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "D.11": Call Create_Tax_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "E.3": Call Create_RelatedParty_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "E.5": Call Create_ContingentLiabilities_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "F.8": Call Create_RatioVariance_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "F.9": Call Create_ScheduleIII_Aging_Note(wsNotes, notesRow, wsSelect.Range("G" & i).Value)
                Case "B.2": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Other Equity", "Other Equity", True)
                Case "B.3": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Borrowings", "Long-term Borrowings", True)
                Case "B.4": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Trade Payables", "Trade Payables", True)
                Case "B.5": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Other Financial Liabilities", "Other Current Liabilities", True)
                Case "B.6": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Other Non-Financial Liabilities", "Other Long-term Liabilities", True)
                Case "C.5": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Inventories", "Inventories", False)
                Case "C.6": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Trade Receivables", "Trade Receivables", False)
                Case "C.8": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Other Assets", "Other Current Assets", False)
                Case "D.1": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Revenue from Operations", "Revenue from Operations", True)
                Case "D.2": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Other Income", "Other Income", True)
                Case "D.4": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Employee Benefits Expense", "Employee Benefits Expense", False)
                Case "D.5": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Finance Costs", "Finance Costs", False)
                Case "D.6": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Depreciation and Amortization", "Depreciation and Amortization", False)
                Case "D.7": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Other Expenses", "Other Expenses", False)
                Case "D.8": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Exceptional and Extraordinary Items", "Exceptional Items", False)
                Case "D.9": Call Create_Note_From_Groupings(wsNotes, notesRow, wsSelect.Range("G" & i).Value, "Prior Period Items", "Prior Period Items", False)
                Case Else
                    If Not wsSelect.Range("A" & i).Value Like "A.2.*" Then
                        wsNotes.Range("A" & notesRow).Value = "Note " & wsSelect.Range("G" & i).Value & ": " & wsSelect.Range("B" & i).Value
                        wsNotes.Range("A" & notesRow).Font.Bold = True
                        wsNotes.Range("A" & notesRow + 1).Value = "[Detailed template for this note to be built.]"
                        notesRow = notesRow + 3
                    End If
            End Select
        End If
    Next i
    Exit Sub
NotesError:
    Debug.Print "    --> FAILED: Generate_Notes_To_Accounts. Error: " & Err.Description
End Sub

Private Sub Create_PPE_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    Dim wsPPE As Worksheet, lastPPERow As Long, i As Long, startRow As Long
    Set wsPPE = ThisWorkbook.Sheets("Input_PPE_Schedule")
    lastPPERow = wsPPE.Cells(wsPPE.Rows.Count, "A").End(xlUp).Row
    If lastPPERow < 2 Then Exit Sub
    ws.Range("A" & r).Value = "Note " & noteNum & ": Property, Plant and Equipment": ws.Range("A" & r).Font.Bold = True: r = r + 1
    Dim headers1() As Variant, headers2() As Variant
    Dim endDate As Date, prevDate As Date
    endDate = ThisWorkbook.Sheets("Common_Control_Sheet").Range("B5").Value
    prevDate = DateAdd("yyyy", -1, endDate)
    headers1 = Array("", "Gross Block", "", "", "", "Accumulated Depreciation", "", "", "", "Net Block", "")
    headers2 = Array("Particulars", "Opening", "Additions", "Disposals", "Closing", "Opening", "For the Year", "On Disposals", "Closing", "As at " & Format(endDate, "dd-mmm-yy"), "As at " & Format(prevDate, "dd-mmm-yy"))
    startRow = r
    ws.Range("A" & r).Resize(1, 11).Value = headers1
    ws.Range("A" & r + 1).Resize(1, 11).Value = headers2
    ws.Range("B" & r & ":E" & r).Merge: ws.Range("F" & r & ":I" & r).Merge: ws.Range("J" & r & ":K" & r).Merge
    ws.Range("B" & r & ":K" & r).HorizontalAlignment = xlCenter
    ws.Range("A" & r & ":K" & r + 1).Font.Bold = True
    r = r + 2
    For i = 2 To lastPPERow
        ws.Cells(r, "A").Value = wsPPE.Cells(i, "A").Value
        ws.Cells(r, "B").Formula = "='Input_PPE_Schedule'!B" & i
        ws.Cells(r, "C").Formula = "='Input_PPE_Schedule'!C" & i
        ws.Cells(r, "D").Formula = "='Input_PPE_Schedule'!D" & i
        ws.Cells(r, "E").Formula = "=B" & r & "+C" & r & "-D" & r
        ws.Cells(r, "F").Formula = "='Input_PPE_Schedule'!E" & i
        ws.Cells(r, "G").Formula = "='Input_PPE_Schedule'!F" & i
        ws.Cells(r, "H").Formula = "='Input_PPE_Schedule'!G" & i
        ws.Cells(r, "I").Formula = "=F" & r & "+G" & r & "-H" & r
        ws.Cells(r, "J").Formula = "=E" & r & "-I" & r
        ws.Cells(r, "K").Formula = "=B" & r & "-F" & r
        r = r + 1
    Next i
    ws.Cells(r, "A").Value = "Total": ws.Range("A" & r & ":K" & r).Font.Bold = True
    Dim col As Integer
    For col = 2 To 11
        ws.Cells(r, col).Formula = "=SUM(" & ws.Cells(startRow + 2, col).Address(False, False) & ":" & ws.Cells(r - 1, col).Address(False, False) & ")"
    Next col
    ws.Range("B" & startRow & ":K" & r).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Range("A" & startRow & ":K" & r).Borders.LineStyle = xlContinuous
    ws.Columns("A:K").AutoFit
    r = r + 3
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_PPE_Note. Error: " & Err.Description
End Sub

Private Sub Create_ShareCapital_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    Dim startRow As Long, endRow As Long
    startRow = r
    ws.Range("A" & r).Value = "Note " & noteNum & ": Share Capital": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "Authorised Capital": ws.Range("A" & r).Font.Italic = True: r = r + 1
    ws.Range("A" & r).Formula = "='Input_Share_Capital'!B3 & "" Equity Shares of "" & TEXT('Input_Share_Capital'!C3, ""0"") & "" each""": ws.Range("B" & r).Formula = "='Input_Share_Capital'!D3": ws.Range("C" & r).Formula = "='Input_Share_Capital'!E3": r = r + 1
    ws.Range("A" & r).Value = "Issued, Subscribed and Fully Paid Up": ws.Range("A" & r).Font.Italic = True: r = r + 1
    ws.Range("A" & r).Formula = "='Input_Share_Capital'!B10 & "" Equity Shares of "" & TEXT('Input_Share_Capital'!C3, ""0"") & "" each""": ws.Range("B" & r).Formula = "='Input_Share_Capital'!D10": ws.Range("C" & r).Formula = "='Input_Share_Capital'!E10": ws.Range("B" & r, "C" & r).Font.Bold = True: r = r + 2
    ws.Range("A" & r).Value = "Reconciliation of the number of shares outstanding:": ws.Range("A" & r).Font.Italic = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Formula = "='Input_Share_Capital'!A8": ws.Range("B" & r).Formula = "='Input_Share_Capital'!B8": ws.Range("C" & r).Formula = "='Input_Share_Capital'!C8": r = r + 1
    ws.Range("A" & r).Formula = "='Input_Share_Capital'!A9": ws.Range("B" & r).Formula = "='Input_Share_Capital'!B9": ws.Range("C" & r).Formula = "='Input_Share_Capital'!C9": r = r + 1
    ws.Range("A" & r).Formula = "='Input_Share_Capital'!A10": ws.Range("B" & r).Formula = "='Input_Share_Capital'!B10": ws.Range("C" & r).Formula = "='Input_Share_Capital'!C10": r = r + 1
    r = r + 2
    ws.Range("A" & r).Value = "Details of shareholders holding more than 5% of the aggregate shares in the Company": ws.Range("A" & r).Font.Italic = True: r = r + 1
    ws.Range("A" & r).Resize(1, 4).Value = Array("Name of Shareholder", "No. of Shares (CY)", "% Holding (CY)", "No. of Shares (PY)"): ws.Range("A" & r, "D" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Formula = "='Input_Share_Capital'!A15": ws.Range("B" & r).Formula = "='Input_Share_Capital'!B15": ws.Range("C" & r).Formula = "='Input_Share_Capital'!C15": ws.Range("D" & r).Formula = "='Input_Share_Capital'!D15": r = r + 1
    ws.Range("A" & r).Formula = "='Input_Share_Capital'!A16": ws.Range("B" & r).Formula = "='Input_Share_Capital'!B16": ws.Range("C" & r).Formula = "='Input_Share_Capital'!C16": ws.Range("D" & r).Formula = "='Input_Share_Capital'!D16": r = r + 1
    endRow = r
    ws.Range("B" & startRow + 2 & ":C" & endRow).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Columns("A:D").AutoFit
    r = endRow + 3
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_ShareCapital_Note. Error: " & Err.Description
End Sub

Private Sub Create_Intangible_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    Dim wsIntangible As Worksheet, lastRow As Long, i As Long, startRow As Long
    Set wsIntangible = ThisWorkbook.Sheets("Input_Intangible_Schedule")
    lastRow = wsIntangible.Cells(wsIntangible.Rows.Count, "A").End(xlUp).Row
    If lastRow < 4 Then Exit Sub
    ws.Range("A" & r).Value = "Note " & noteNum & ": Intangible Assets": ws.Range("A" & r).Font.Bold = True: r = r + 1
    Dim headers1() As Variant, headers2() As Variant
    Dim endDate As Date, prevDate As Date
    endDate = ThisWorkbook.Sheets("Common_Control_Sheet").Range("B5").Value
    prevDate = DateAdd("yyyy", -1, endDate)
    headers1 = Array("", "Gross Block", "", "", "", "Accumulated Amortization", "", "", "", "Net Block", "")
    headers2 = Array("Particulars", "Opening", "Additions", "Disposals", "Closing", "Opening", "For the Year", "On Disposals", "Closing", "As at " & Format(endDate, "dd-mmm-yy"), "As at " & Format(prevDate, "dd-mmm-yy"))
    startRow = r
    ws.Range("A" & r).Resize(1, 11).Value = headers1
    ws.Range("A" & r + 1).Resize(1, 11).Value = headers2
    ws.Range("B" & r & ":E" & r).Merge: ws.Range("F" & r & ":I" & r).Merge: ws.Range("J" & r & ":K" & r).Merge
    ws.Range("B" & r & ":K" & r).HorizontalAlignment = xlCenter
    ws.Range("A" & r & ":K" & r + 1).Font.Bold = True
    r = r + 2
    For i = 3 To lastRow
        If wsIntangible.Cells(i, "A").Value = "" Then Exit For
        ws.Cells(r, "A").Value = wsIntangible.Cells(i, "A").Value
        ws.Cells(r, "B").Formula = "='Input_Intangible_Schedule'!B" & i
        ws.Cells(r, "C").Formula = "='Input_Intangible_Schedule'!C" & i
        ws.Cells(r, "D").Formula = "='Input_Intangible_Schedule'!D" & i
        ws.Cells(r, "E").Formula = "=B" & r & "+C" & r & "-D" & r
        ws.Cells(r, "F").Formula = "='Input_Intangible_Schedule'!E" & i
        ws.Cells(r, "G").Formula = "='Input_Intangible_Schedule'!F" & i
        ws.Cells(r, "H").Formula = "='Input_Intangible_Schedule'!G" & i
        ws.Cells(r, "I").Formula = "=F" & r & "+G" & r & "-H" & r
        ws.Cells(r, "J").Formula = "=E" & r & "-I" & r
        ws.Cells(r, "K").Formula = "=B" & r & "-F" & r
        r = r + 1
    Next i
    ws.Cells(r, "A").Value = "Total": ws.Range("A" & r & ":K" & r).Font.Bold = True
    Dim col As Integer
    For col = 2 To 11
        ws.Cells(r, col).Formula = "=SUM(" & ws.Cells(startRow + 2, col).Address(False, False) & ":" & ws.Cells(r - 1, col).Address(False, False) & ")"
    Next col
    ws.Range("B" & startRow & ":K" & r).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Range("A" & startRow & ":K" & r).Borders.LineStyle = xlContinuous
    ws.Columns("A:K").AutoFit
    r = r + 3
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_Intangible_Note. Error: " & Err.Description
End Sub

Private Sub Create_CWIP_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    Dim startRow As Long
    startRow = r
    ws.Range("A" & r).Value = "Note " & noteNum & ": Capital Work-in-Progress": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Formula = "='Input_CWIP_Schedule'!A3": ws.Range("B" & r).Formula = "='Input_CWIP_Schedule'!B3": ws.Range("C" & r).Formula = "='Input_CWIP_Schedule'!C3": r = r + 1
    ws.Range("A" & r).Formula = "='Input_CWIP_Schedule'!A4": ws.Range("B" & r).Formula = "='Input_CWIP_Schedule'!B4": ws.Range("C" & r).Formula = "='Input_CWIP_Schedule'!C4": r = r + 1
    ws.Range("A" & r).Formula = "='Input_CWIP_Schedule'!A5": ws.Range("B" & r).Formula = "='Input_CWIP_Schedule'!B5": ws.Range("C" & r).Formula = "='Input_CWIP_Schedule'!C5": r = r + 1
    ws.Range("A" & r).Formula = "='Input_CWIP_Schedule'!A6": ws.Range("B" & r).Formula = "='Input_CWIP_Schedule'!B6": ws.Range("C" & r).Formula = "='Input_CWIP_Schedule'!C6": ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    ws.Range("B" & startRow + 2 & ":C" & r - 1).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Range("A" & startRow + 1 & ":C" & r - 1).Borders.LineStyle = xlContinuous
    ws.Range("A" & r - 1 & ":C" & r - 1).Borders(xlEdgeTop).Weight = xlMedium
    ws.Columns("A:C").AutoFit
    r = r + 3
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_CWIP_Note. Error: " & Err.Description
End Sub

Private Sub Create_EPS_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    Dim startRow As Long, pat_cell_cy As Range, pat_cell_py As Range
    Dim pat_address_cy As String, pat_address_py As String
    
    Set pat_cell_cy = ThisWorkbook.Sheets("Statement_of_PL").Range("A1:A100").Find("Profit (Loss) for the period", LookIn:=xlFormulas, lookat:=xlPart)
    If pat_cell_cy Is Nothing Then
        pat_address_cy = "0": pat_address_py = "0"
    Else
        pat_address_cy = "'Statement_of_PL'!" & pat_cell_cy.Offset(0, 2).Address(False, False)
        pat_address_py = "'Statement_of_PL'!" & pat_cell_cy.Offset(0, 3).Address(False, False)
    End If
    
    startRow = r
    ws.Range("A" & r).Value = "Note " & noteNum & ": Earnings Per Share (EPS)": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    
    ws.Range("A" & r).Value = "Profit attributable to Equity Shareholders": ws.Range("B" & r).Formula = "=" & pat_address_cy: ws.Range("C" & r).Formula = "=" & pat_address_py: r = r + 1
    ws.Range("A" & r).Value = "Weighted average number of Equity Shares": ws.Range("B" & r).Formula = "='Input_Share_Capital'!B10": ws.Range("C" & r).Formula = "='Input_Share_Capital'!C10": r = r + 1
    ws.Range("A" & r).Value = "Nominal value of Equity Share": ws.Range("B" & r).Formula = "='Input_Share_Capital'!C3": ws.Range("C" & r).Formula = "='Input_Share_Capital'!C3": r = r + 1
    ws.Range("A" & r).Value = "Basic Earnings Per Share": ws.Range("B" & r).Formula = "=IFERROR(B" & r - 3 & "/B" & r - 2 & ",0)": ws.Range("C" & r).Formula = "=IFERROR(C" & r - 3 & "/C" & r - 2 & ",0)": ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "Diluted Earnings Per Share": ws.Range("B" & r).Formula = "=B" & r - 1: ws.Range("C" & r).Formula = "=C" & r - 1: ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1

    ws.Range("B" & startRow + 2 & ":C" & startRow + 2).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Range("B" & startRow + 3 & ":C" & startRow + 3).NumberFormat = "#,##0"
    ws.Range("B" & startRow + 4 & ":C" & startRow + 4).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Range("B" & startRow + 5 & ":C" & startRow + 6).NumberFormat = "0.00"
    ws.Range("A" & startRow + 1 & ":C" & r - 1).Borders.LineStyle = xlContinuous
    ws.Columns("A:C").AutoFit
    r = r + 3
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_EPS_Note. Error: " & Err.Description
End Sub

Private Sub Create_RelatedParty_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    
    Dim wsRP As Worksheet: Set wsRP = ThisWorkbook.Sheets("Input_Related_Party_Txns")
    Dim tblRP As ListObject
    On Error Resume Next
    Set tblRP = wsRP.ListObjects("tblRelatedParty")
    On Error GoTo NoteError
    If tblRP Is Nothing Then Exit Sub
    If tblRP.ListRows.Count = 0 Then Exit Sub
    
    Dim uniqueParties As Object: Set uniqueParties = CreateObject("Scripting.Dictionary")
    Dim uniqueTxnTypes As Object: Set uniqueTxnTypes = CreateObject("Scripting.Dictionary")
    Dim uniqueRelationships As Object: Set uniqueRelationships = CreateObject("Scripting.Dictionary")
    Dim cell As Range
    
    ' Collect unique items
    For Each cell In tblRP.ListColumns("Related Party Name").DataBodyRange
        If Trim(cell.Value) <> "" Then uniqueParties(Trim(cell.Value)) = cell.Offset(0, 1).Value
    Next cell
    For Each cell In tblRP.ListColumns("Transaction Type").DataBodyRange
        If Trim(cell.Value) <> "" Then uniqueTxnTypes(Trim(cell.Value)) = 1
    Next cell
    For Each cell In tblRP.ListColumns("Relationship").DataBodyRange
        If Trim(cell.Value) <> "" Then uniqueRelationships(Trim(cell.Value)) = 1
    Next cell
    
    ws.Range("A" & r).Value = "Note " & noteNum & ": Related Party Disclosures (as per AS 18)": ws.Range("A" & r).Font.Bold = True: r = r + 2

    ' Part 1: List of Related Parties
    ws.Range("A" & r).Value = "List of related parties and their relationship:": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 2).Value = Array("Name of Related Party", "Relationship"): ws.Range("A" & r, "B" & r).Font.Bold = True: r = r + 1
    Dim partyKey As Variant
    For Each partyKey In uniqueParties.Keys
        ws.Cells(r, "A").Value = partyKey
        ws.Cells(r, "B").Value = uniqueParties(partyKey)
        r = r + 1
    Next partyKey
    r = r + 2
    
    ' Part 2: Summary of Transactions
    ws.Range("A" & r).Value = "Transactions with related parties during the year:": ws.Range("A" & r).Font.Bold = True: r = r + 1
    Dim relKey As Variant, txnKey As Variant, relCol As Integer, txnRow As Integer, startTxnRow As Long
    
    startTxnRow = r
    ws.Cells(r, 1).Value = "Nature of Transaction"
    relCol = 2
    For Each relKey In uniqueRelationships.Keys
        ws.Cells(r, relCol).Value = relKey
        relCol = relCol + 1
    Next relKey
    ws.Cells(r, relCol).Value = "Total"
    ws.Range(ws.Cells(r, 1), ws.Cells(r, relCol)).Font.Bold = True
    
    txnRow = r + 1
    For Each txnKey In uniqueTxnTypes.Keys
        ws.Cells(txnRow, 1).Value = txnKey
        relCol = 2
        For Each relKey In uniqueRelationships.Keys
            ws.Cells(txnRow, relCol).Formula = "=SUMIFS(tblRelatedParty[Amount (CY)], tblRelatedParty[Relationship],""" & relKey & """, tblRelatedParty[Transaction Type], """ & txnKey & """)"
            relCol = relCol + 1
        Next relKey
        ws.Cells(txnRow, relCol).Formula = "=SUM(" & ws.Range(ws.Cells(txnRow, 2), ws.Cells(txnRow, relCol - 1)).Address(False, False) & ")"
        txnRow = txnRow + 1
    Next txnKey
    
    ' Total Row for Transactions
    ws.Cells(txnRow, 1).Value = "Total"
    ws.Cells(txnRow, 1).Font.Bold = True
    For relCol = 2 To uniqueRelationships.Count + 2
        ws.Cells(txnRow, relCol).Formula = "=SUM(" & ws.Range(ws.Cells(startTxnRow + 1, relCol), ws.Cells(txnRow - 1, relCol)).Address(False, False) & ")"
        ws.Cells(txnRow, relCol).Font.Bold = True
    Next relCol
    
    ws.Range(ws.Cells(startTxnRow + 1, 2), ws.Cells(txnRow, uniqueRelationships.Count + 2)).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Range(ws.Cells(startTxnRow, 1), ws.Cells(txnRow, uniqueRelationships.Count + 2)).Borders.LineStyle = xlContinuous
    r = txnRow + 3
    
    ' Part 3: Outstanding Balances
    ws.Range("A" & r).Value = "Balance outstanding at the year-end:": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Relationship", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    Dim startBalRow As Long: startBalRow = r
    For Each relKey In uniqueRelationships.Keys
        ws.Cells(r, 1).Value = relKey
        ws.Cells(r, 2).Formula = "=SUMIFS(tblRelatedParty[Balance Outstanding (CY)], tblRelatedParty[Relationship], """ & relKey & """)"
        ws.Cells(r, 3).Formula = "=SUMIFS(tblRelatedParty[Balance Outstanding (PY)], tblRelatedParty[Relationship], """ & relKey & """)"
        r = r + 1
    Next relKey
    ws.Cells(r, 1).Value = "Total": ws.Cells(r, 1).Font.Bold = True
    ws.Cells(r, 2).Formula = "=SUM(B" & startBalRow & ":B" & r - 1 & ")": ws.Cells(r, 2).Font.Bold = True
    ws.Cells(r, 3).Formula = "=SUM(C" & startBalRow & ":C" & r - 1 & ")": ws.Cells(r, 3).Font.Bold = True
    ws.Range("B" & startBalRow & ":C" & r).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Range("A" & startBalRow - 1 & ":C" & r).Borders.LineStyle = xlContinuous
    
    ws.Columns.AutoFit
    r = r + 3
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_RelatedParty_Note. Error: " & Err.Description
End Sub

Private Sub Create_AccountingPolicies_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    
    Dim wsSelect As Worksheet: Set wsSelect = ThisWorkbook.Sheets("Selection_Sheet")
    Dim policies As Object: Set policies = CreateObject("Scripting.Dictionary")
    
    ' Populate dictionary with boilerplate policy text
    policies.Add "A.2.1", "Revenue is recognized to the extent that it is probable that the economic benefits will flow to the Company and the revenue can be reliably measured. Revenue is measured at the fair value of the consideration received or receivable, net of returns and allowances, trade discounts and volume rebates."
    policies.Add "A.2.2", "Property, Plant and Equipment are stated at cost, less accumulated depreciation and impairment losses, if any. Cost comprises the purchase price and any attributable cost of bringing the asset to its working condition for its intended use. Depreciation is provided using the Straight Line Method (SLM) over the estimated useful lives of the assets."
    policies.Add "A.2.3", "Intangible assets are recorded at the consideration paid for acquisition. Intangible assets are amortized over their respective individual estimated useful lives on a straight-line basis, from the date that they are available for use."
    policies.Add "A.2.5", "Inventories are valued at the lower of cost and net realizable value. Cost is determined on a weighted average basis. Net realizable value is the estimated selling price in the ordinary course of business, less estimated costs of completion and the estimated costs necessary to make the sale."
    policies.Add "A.2.6", "Investments that are readily realizable and intended to be held for not more than a year are classified as current investments. All other investments are classified as long-term investments. Current investments are carried at lower of cost and fair value, determined category-wise. Long-term investments are carried at cost. However, provision for diminution in value is made to recognize a decline other than temporary in the value of the investments."
    policies.Add "A.2.8", "Employee benefits include provident fund, gratuity, and compensated absences. The Company's contribution to provident fund is charged to the statement of profit and loss. The Company provides for gratuity, a defined benefit plan, based on actuarial valuation."
    policies.Add "A.2.9", "Borrowing costs directly attributable to the acquisition, construction or production of an asset that necessarily takes a substantial period of time to get ready for its intended use or sale are capitalized as part of the cost of the respective asset. All other borrowing costs are expensed in the period they occur."
    policies.Add "A.2.10", "A provision is recognized when the Company has a present obligation as a result of a past event, it is probable that an outflow of resources will be required to settle the obligation, and a reliable estimate can be made of the amount of the obligation. Contingent liabilities are not provided for but are disclosed in the notes."
    policies.Add "A.2.11", "Tax expense comprises of current and deferred tax. Current income tax is measured at the amount expected to be paid to the tax authorities in accordance with the Income-tax Act, 1961. Deferred tax is recognized on timing differences, being the difference between taxable income and accounting income that originate in one period and are capable of reversal in one or more subsequent periods."
    policies.Add "A.2.16", "Cash and cash equivalents for the purposes of the cash flow statement comprise cash at bank and in hand and short-term investments with an original maturity of three months or less."

    ws.Range("A" & r).Value = "Note " & noteNum & ": Significant Accounting Policies": ws.Range("A" & r).Font.Bold = True: r = r + 2

    Dim lastSelectRow As Long, i As Long, policyRef As String
    lastSelectRow = wsSelect.Cells(wsSelect.Rows.Count, "A").End(xlUp).Row
    
    For i = 2 To lastSelectRow
        policyRef = wsSelect.Range("A" & i).Value
        ' Check if it's a sub-policy and is selected for inclusion
        If InStr(1, policyRef, "A.2.") > 0 And wsSelect.Range("F" & i).Value = "Yes" Then
            If policies.Exists(policyRef) Then
                ws.Cells(r, 1).Value = wsSelect.Range("G" & i).Value & " " & wsSelect.Range("B" & i).Value
                ws.Cells(r, 1).Font.Bold = True
                r = r + 1
                ws.Cells(r, 1).Value = policies(policyRef)
                ws.Cells(r, 1).WrapText = True
                r = r + 2
            End If
        End If
    Next i
    
    ws.Columns("A").ColumnWidth = 120
    r = r + 1 ' Extra space after the note
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_AccountingPolicies_Note. Error: " & Err.Description
End Sub

Private Sub Create_ContingentLiabilities_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    
    Dim wsCL As Worksheet: Set wsCL = ThisWorkbook.Sheets("Input_Contingent_Liab")
    Dim tblCL As ListObject
    On Error Resume Next
    Set tblCL = wsCL.ListObjects("tblContingentLiab")
    On Error GoTo NoteError
    
    ws.Range("A" & r).Value = "Note " & noteNum & ": Contingent Liabilities and Commitments": ws.Range("A" & r).Font.Bold = True: r = r + 2
    
    Dim startRow As Long, i As Long
    
    ' Part 1: Contingent Liabilities
    ws.Range("A" & r).Value = "a) Contingent Liabilities": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True
    startRow = r + 1: r = r + 1
    
    If Not tblCL Is Nothing Then
        For i = 1 To tblCL.ListRows.Count
            If tblCL.ListRows(i).Range(1, 2).Value = "Contingent Liability" Then
                ws.Cells(r, 1).Value = "  - " & tblCL.ListRows(i).Range(1, 1).Value
                ws.Cells(r, 2).Value = tblCL.ListRows(i).Range(1, 3).Value
                ws.Cells(r, 3).Value = tblCL.ListRows(i).Range(1, 4).Value
                r = r + 1
            End If
        Next i
    End If
    
    ws.Cells(r, 1).Value = "Total Contingent Liabilities": ws.Cells(r, 1).Font.Bold = True
    ws.Cells(r, 2).Formula = "=SUM(B" & startRow & ":B" & r - 1 & ")": ws.Cells(r, 2).Font.Bold = True
    ws.Cells(r, 3).Formula = "=SUM(C" & startRow & ":C" & r - 1 & ")": ws.Cells(r, 3).Font.Bold = True
    ws.Range("A" & startRow - 1, "C" & r).Borders.LineStyle = xlContinuous
    r = r + 2
    
    ' Part 2: Commitments
    ws.Range("A" & r).Value = "b) Commitments": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True
    startRow = r + 1: r = r + 1
    
    If Not tblCL Is Nothing Then
        For i = 1 To tblCL.ListRows.Count
            If tblCL.ListRows(i).Range(1, 2).Value = "Commitment" Then
                ws.Cells(r, 1).Value = "  - " & tblCL.ListRows(i).Range(1, 1).Value
                ws.Cells(r, 2).Value = tblCL.ListRows(i).Range(1, 3).Value
                ws.Cells(r, 3).Value = tblCL.ListRows(i).Range(1, 4).Value
                r = r + 1
            End If
        Next i
    End If
    
    ws.Cells(r, 1).Value = "Total Commitments": ws.Cells(r, 1).Font.Bold = True
    ws.Cells(r, 2).Formula = "=SUM(B" & startRow & ":B" & r - 1 & ")": ws.Cells(r, 2).Font.Bold = True
    ws.Cells(r, 3).Formula = "=SUM(C" & startRow & ":C" & r - 1 & ")": ws.Cells(r, 3).Font.Bold = True
    ws.Range("A" & startRow - 1, "C" & r).Borders.LineStyle = xlContinuous
    
    ws.Columns("A:C").AutoFit
    r = r + 3
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_ContingentLiabilities_Note. Error: " & Err.Description
End Sub

Private Sub Create_ScheduleIII_Aging_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    
    Dim wsCWIP As Worksheet: Set wsCWIP = ThisWorkbook.Sheets("Input_CWIP_Schedule")
    Dim wsIA As Worksheet: Set wsIA = ThisWorkbook.Sheets("Input_Intangible_Schedule")
    
    ws.Range("A" & r).Value = "Note " & noteNum & ": Additional Schedule III Disclosures": ws.Range("A" & r).Font.Bold = True: r = r + 2
    
    ' Part 1: CWIP Aging
    ws.Range("A" & r).Value = "a) Aging of Capital Work-in-Progress (CWIP)": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 2).Value = Array("Period", "Amount"): ws.Range("A" & r, "B" & r).Font.Bold = True: r = r + 1
    
    ws.Range("A" & r).Formula = "='Input_CWIP_Schedule'!A10": ws.Range("B" & r).Formula = "='Input_CWIP_Schedule'!B10"
    ws.Range("A" & r + 1).Formula = "='Input_CWIP_Schedule'!A11": ws.Range("B" & r + 1).Formula = "='Input_CWIP_Schedule'!B11"
    ws.Range("A" & r + 2).Formula = "='Input_CWIP_Schedule'!A12": ws.Range("B" & r + 2).Formula = "='Input_CWIP_Schedule'!B12"
    ws.Range("A" & r + 3).Formula = "='Input_CWIP_Schedule'!A13": ws.Range("B" & r + 3).Formula = "='Input_CWIP_Schedule'!B13"
    
    ws.Range("A" & r + 4).Value = "Total": ws.Range("A" & r + 4).Font.Bold = True
    ws.Range("B" & r + 4).Formula = "=SUM(B" & r & ":B" & r + 3 & ")": ws.Range("B" & r + 4).Font.Bold = True
    
    ws.Range("A" & r - 1, "B" & r + 4).Borders.LineStyle = xlContinuous
    ws.Range("B" & r, "B" & r + 4).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    r = r + 7 ' Move down for the next table
    
    ' Part 2: Intangible Assets under Development Aging
    ws.Range("A" & r).Value = "b) Aging of Intangible Assets under Development": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 2).Value = Array("Period", "Amount"): ws.Range("A" & r, "B" & r).Font.Bold = True: r = r + 1
    
    ws.Range("A" & r).Formula = "='Input_Intangible_Schedule'!D9": ws.Range("B" & r).Formula = "='Input_Intangible_Schedule'!E9"
    ws.Range("A" & r + 1).Formula = "='Input_Intangible_Schedule'!D10": ws.Range("B" & r + 1).Formula = "='Input_Intangible_Schedule'!E10"
    ws.Range("A" & r + 2).Formula = "='Input_Intangible_Schedule'!D11": ws.Range("B" & r + 2).Formula = "='Input_Intangible_Schedule'!E11"
    ws.Range("A" & r + 3).Formula = "='Input_Intangible_Schedule'!D12": ws.Range("B" & r + 3).Formula = "='Input_Intangible_Schedule'!E12"

    ws.Range("A" & r + 4).Value = "Total": ws.Range("A" & r + 4).Font.Bold = True
    ws.Range("B" & r + 4).Formula = "=SUM(B" & r & ":B" & r + 3 & ")": ws.Range("B" & r + 4).Font.Bold = True
    
    ws.Range("A" & r - 1, "B" & r + 4).Borders.LineStyle = xlContinuous
    ws.Range("B" & r, "B" & r + 4).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    
    ws.Columns("A:B").AutoFit
    r = r + 7
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_ScheduleIII_Aging_Note. Error: " & Err.Description
End Sub

Private Sub Create_RatioVariance_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    
    Dim wsRatio As Worksheet: Set wsRatio = ThisWorkbook.Sheets("Ratio_Analysis")
    Dim tbl As ListObject
    On Error Resume Next
    Set tbl = wsRatio.ListObjects("tblRatios")
    On Error GoTo NoteError
    If tbl Is Nothing Then Exit Sub
    
    ws.Range("A" & r).Value = "Note " & noteNum & ": Explanation on Financial Ratios": ws.Range("A" & r).Font.Bold = True: r = r + 2
    
    Dim i As Long, startRow As Long, headerCopied As Boolean
    headerCopied = False
    startRow = r
    
    For i = 1 To tbl.ListRows.Count
        ' Check if the absolute variance is 25% or more
        If Abs(tbl.ListRows(i).Range(1, 5).Value) >= 0.25 Then
            If Not headerCopied Then
                tbl.HeaderRowRange.Copy ws.Cells(r, 1)
                r = r + 1
                headerCopied = True
            End If
            tbl.ListRows(i).Range.Copy ws.Cells(r, 1)
            r = r + 1
        End If
    Next i
    
    If headerCopied Then
        ws.Range(ws.Cells(startRow, 1), ws.Cells(r - 1, tbl.HeaderRowRange.Columns.Count)).Borders.LineStyle = xlContinuous
        ws.Columns.AutoFit
        ws.Columns(6).ColumnWidth = 50
    Else
        ws.Range("A" & r).Value = "There are no financial ratios that have changed by more than 25% as compared to the previous year."
        r = r + 1
    End If
    
    r = r + 2
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_RatioVariance_Note. Error: " & Err.Description
End Sub

Private Sub Create_Investments_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    Dim wsInvest As Worksheet: Set wsInvest = ThisWorkbook.Sheets("Input_Investments")
    Dim tbl As ListObject
    On Error Resume Next
    Set tbl = wsInvest.ListObjects("tblInvestments")
    On Error GoTo NoteError
    If tbl Is Nothing Then Exit Sub
    If tbl.ListRows.Count = 0 Then Exit Sub
    
    ws.Range("A" & r).Value = "Note " & noteNum & ": Investments": ws.Range("A" & r).Font.Bold = True: r = r + 2
    
    ' Non-Current Investments
    ws.Range("A" & r).Value = "Non-Current Investments": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True
    Dim startRow As Long: startRow = r + 1: r = r + 1
    Dim i As Long
    For i = 1 To tbl.ListRows.Count
        If tbl.ListRows(i).Range(1, 2).Value = "Non-Current" Then
            ws.Cells(r, 1).Value = "  - " & tbl.ListRows(i).Range(1, 1).Value
            ws.Cells(r, 2).Value = tbl.ListRows(i).Range(1, 3).Value
            ws.Cells(r, 3).Value = tbl.ListRows(i).Range(1, 4).Value
            r = r + 1
        End If
    Next i
    ws.Cells(r, 1).Value = "Total Non-Current": ws.Cells(r, 1).Font.Bold = True
    ws.Cells(r, 2).Formula = "=SUM(B" & startRow & ":B" & r - 1 & ")": ws.Cells(r, 2).Font.Bold = True
    ws.Cells(r, 3).Formula = "=SUM(C" & startRow & ":C" & r - 1 & ")": ws.Cells(r, 3).Font.Bold = True
    ws.Range("A" & startRow - 1, "C" & r).Borders.LineStyle = xlContinuous
    r = r + 2
    
    ' Current Investments
    ws.Range("A" & r).Value = "Current Investments": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True
    startRow = r + 1: r = r + 1
    For i = 1 To tbl.ListRows.Count
        If tbl.ListRows(i).Range(1, 2).Value = "Current" Then
            ws.Cells(r, 1).Value = "  - " & tbl.ListRows(i).Range(1, 1).Value
            ws.Cells(r, 2).Value = tbl.ListRows(i).Range(1, 3).Value
            ws.Cells(r, 3).Value = tbl.ListRows(i).Range(1, 4).Value
            r = r + 1
        End If
    Next i
    ws.Cells(r, 1).Value = "Total Current": ws.Cells(r, 1).Font.Bold = True
    ws.Cells(r, 2).Formula = "=SUM(B" & startRow & ":B" & r - 1 & ")": ws.Cells(r, 2).Font.Bold = True
    ws.Cells(r, 3).Formula = "=SUM(C" & startRow & ":C" & r - 1 & ")": ws.Cells(r, 3).Font.Bold = True
    ws.Range("A" & startRow - 1, "C" & r).Borders.LineStyle = xlContinuous
    r = r + 2
    
    ws.Columns("A:C").AutoFit
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_Investments_Note. Error: " & Err.Description
End Sub

Private Sub Create_Cash_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    ws.Range("A" & r).Value = "Note " & noteNum & ": Cash and Cash Equivalents": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    Dim startRow As Long: startRow = r
    
    ws.Cells(r, 1).Value = "Balances with banks": ws.Cells(r, 2).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Grouping], ""Balances with banks"")": ws.Cells(r, 3).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Grouping], ""Balances with banks"")": r = r + 1
    ws.Cells(r, 1).Value = "Cheques, drafts on hand": ws.Cells(r, 2).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Grouping], ""Cheques, drafts on hand"")": ws.Cells(r, 3).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Grouping], ""Cheques, drafts on hand"")": r = r + 1
    ws.Cells(r, 1).Value = "Cash on hand": ws.Cells(r, 2).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Grouping], ""Cash on hand"")": ws.Cells(r, 3).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Grouping], ""Cash on hand"")": r = r + 1
    ws.Cells(r, 1).Value = "Other bank balances (e.g., in deposit accounts)": ws.Cells(r, 2).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Grouping], ""Other bank balances"")": ws.Cells(r, 3).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Grouping], ""Other bank balances"")": r = r + 1
    
    ws.Cells(r, 1).Value = "Total": ws.Cells(r, 1).Font.Bold = True
    ws.Cells(r, 2).Formula = "=SUM(B" & startRow & ":B" & r - 1 & ")": ws.Cells(r, 2).Font.Bold = True
    ws.Cells(r, 3).Formula = "=SUM(C" & startRow & ":C" & r - 1 & ")": ws.Cells(r, 3).Font.Bold = True
    
    ws.Range("A" & startRow - 1, "C" & r).Borders.LineStyle = xlContinuous
    ws.Range("B" & startRow, "C" & r).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Columns("A:C").AutoFit
    r = r + 3
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_Cash_Note. Error: " & Err.Description
End Sub

Private Sub Create_COGS_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    ws.Range("A" & r).Value = "Note " & noteNum & ": Cost of Materials, Purchases, and Changes in Inventory": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    Dim startRow As Long: startRow = r
    
    ws.Cells(r, 1).Value = "Cost of materials consumed": ws.Cells(r, 2).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Cost of Materials Consumed"")": ws.Cells(r, 3).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Cost of Materials Consumed"")": r = r + 1
    ws.Cells(r, 1).Value = "Purchases of Stock-in-Trade": ws.Cells(r, 2).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Purchases of Stock-in-Trade"")": ws.Cells(r, 3).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Purchases of Stock-in-Trade"")": r = r + 1
    ws.Cells(r, 1).Value = "Changes in inventories of finished goods, work-in-progress and Stock-in-Trade": ws.Cells(r, 2).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], ""Changes in Inventories"")": ws.Cells(r, 3).Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], ""Changes in Inventories"")": r = r + 1
    
    ws.Range("A" & startRow - 1, "C" & r - 1).Borders.LineStyle = xlContinuous
    ws.Range("B" & startRow, "C" & r - 1).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Columns("A:C").AutoFit
    r = r + 3
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_COGS_Note. Error: " & Err.Description
End Sub

Private Sub Create_EmployeeBenefits_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    Dim wsEB As Worksheet: Set wsEB = ThisWorkbook.Sheets("Input_Employee_Benefits")
    
    ws.Range("A" & r).Value = "Note " & noteNum & ": Employee Benefit Obligations (AS 15)": ws.Range("A" & r).Font.Bold = True: r = r + 2
    
    ' Defined Contribution Plan
    ws.Range("A" & r).Value = "a) Defined Contribution Plan": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "The Company has a defined contribution plan for its employees. The total expense recognized in the Statement of Profit and Loss for the year is as follows:": ws.Range("A" & r).WrapText = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "  - Employer's Contribution to Provident Fund": ws.Range("B" & r).Formula = "='Input_Employee_Benefits'!B2": ws.Range("C" & r).Formula = "='Input_Employee_Benefits'!C2": r = r + 1
    ws.Range("B" & r - 1 & ":C" & r - 1).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    r = r + 1
    
    ' Defined Benefit Plan
    ws.Range("A" & r).Value = "b) Defined Benefit Plan (Gratuity)": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "The Company has a defined benefit gratuity plan. The plan is unfunded. The following tables summarise the components of net benefit expense recognised in the statement of profit and loss and the funded status and amounts recognised in the balance sheet for the respective plans.": ws.Range("A" & r).WrapText = True: r = r + 2
    ws.Range("A" & r).Resize(1, 3).Value = Array("Net Employee Benefit Expense (Recognised in P&L)", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Formula = "='Input_Employee_Benefits'!A7": ws.Range("B" & r).Formula = "='Input_Employee_Benefits'!B7": ws.Range("C" & r).Formula = "='Input_Employee_Benefits'!C7": r = r + 1
    ws.Range("A" & r).Formula = "='Input_Employee_Benefits'!A8": ws.Range("B" & r).Formula = "='Input_Employee_Benefits'!B8": ws.Range("C" & r).Formula = "='Input_Employee_Benefits'!C8": r = r + 1
    ws.Range("A" & r).Formula = "='Input_Employee_Benefits'!A9": ws.Range("B" & r).Formula = "='Input_Employee_Benefits'!B9": ws.Range("C" & r).Formula = "='Input_Employee_Benefits'!C9": r = r + 1
    ws.Range("A" & r, "C" & r).Borders(xlEdgeTop).LineStyle = xlContinuous
    ws.Range("A" & r).Value = "Total Expense": ws.Range("B" & r).Formula = "=SUM(B" & r - 3 & ":B" & r - 1 & ")": ws.Range("C" & r).Formula = "=SUM(C" & r - 3 & ":C" & r - 1 & ")": ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 2

    ws.Range("A" & r).Resize(1, 3).Value = Array("Balance Sheet Reconciliation", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Formula = "='Input_Employee_Benefits'!A13": ws.Range("B" & r).Formula = "='Input_Employee_Benefits'!B13": ws.Range("C" & r).Formula = "='Input_Employee_Benefits'!C13": r = r + 1
    ws.Range("A" & r).Formula = "='Input_Employee_Benefits'!A14": ws.Range("B" & r).Formula = "='Input_Employee_Benefits'!B14": ws.Range("C" & r).Formula = "='Input_Employee_Benefits'!C14": r = r + 1
    ws.Range("A" & r, "C" & r).Borders(xlEdgeTop).LineStyle = xlContinuous
    ws.Range("A" & r).Value = "Net Liability": ws.Range("B" & r).Formula = "=SUM(B" & r - 2 & ":B" & r - 1 & ")": ws.Range("C" & r).Formula = "=SUM(C" & r - 2 & ":C" & r - 1 & ")": ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1

    ws.Columns("A").ColumnWidth = 60
    ws.Columns("B:C").ColumnWidth = 20
    ws.Range("A:C").WrapText = True
    r = r + 2
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_EmployeeBenefits_Note. Error: " & Err.Description
End Sub

Private Sub Create_Tax_Note(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String)
    On Error GoTo NoteError
    Dim wsTax As Worksheet: Set wsTax = ThisWorkbook.Sheets("Input_Taxes")
    Dim pbt_cell As Range, pbt_address_cy As String, pbt_address_py As String
    Set pbt_cell = ThisWorkbook.Sheets("Statement_of_PL").Range("A1:A100").Find("Profit before tax", LookIn:=xlFormulas, lookat:=xlPart)
    If pbt_cell Is Nothing Then
        pbt_address_cy = "0": pbt_address_py = "0"
    Else
        pbt_address_cy = "'Statement_of_PL'!" & pbt_cell.Offset(0, 2).Address(False, False)
        pbt_address_py = "'Statement_of_PL'!" & pbt_cell.Offset(0, 3).Address(False, False)
    End If

    ws.Range("A" & r).Value = "Note " & noteNum & ": Income Taxes (AS 22)": ws.Range("A" & r).Font.Bold = True: r = r + 2
    
    ' Components of Tax Expense
    ws.Range("A" & r).Value = "a) Components of Income Tax Expense": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "Current Tax": ws.Range("B" & r).Formula = "='Input_Taxes'!B2": ws.Range("C" & r).Formula = "='Input_Taxes'!C2": r = r + 1
    ws.Range("A" & r).Value = "Deferred Tax": ws.Range("B" & r).Formula = "='Input_Taxes'!B3": ws.Range("C" & r).Formula = "='Input_Taxes'!C3": r = r + 1
    ws.Range("A" & r).Value = "Total Tax Expense": ws.Range("B" & r).Formula = "=SUM(B" & r - 2 & ":B" & r - 1 & ")": ws.Range("C" & r).Formula = "=SUM(C" & r - 2 & ":C" & r - 1 & ")": ws.Range("A" & r, "C" & r).Font.Bold = True
    ws.Range("A" & r - 2, "C" & r).Borders.LineStyle = xlContinuous
    r = r + 3
    
    ' Tax Reconciliation
    ws.Range("A" & r).Value = "b) Reconciliation of Tax Expense and Accounting Profit": ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "(This reconciliation is typically shown for the Current Year only)": r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Rate %", "Amount"): ws.Range("A" & r, "C" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Value = "Profit Before Tax": ws.Range("C" & r).Formula = "=" & pbt_address_cy: r = r + 1
    ws.Range("A" & r).Value = "Tax at applicable rate": ws.Range("B" & r).Formula = "='Input_Taxes'!B6": ws.Range("C" & r).Formula = "=C" & r - 1 & "*B" & r: r = r + 1
    ws.Range("A" & r).Value = "Tax effect of amounts that are not deductible (taxable) in calculating taxable income:": r = r + 1
    ws.Range("A" & r).Value = "  - Non-deductible expenses": ws.Range("C" & r).Formula = "='Input_Taxes'!B7": r = r + 1
    ws.Range("A" & r).Value = "  - Other differences": ws.Range("C" & r).Formula = "='Input_Taxes'!B8": r = r + 1
    ws.Range("A" & r).Value = "Income Tax Expense": ws.Range("C" & r).Formula = "=SUM(C" & r - 4 & ":C" & r - 1 & ")": ws.Range("A" & r, "C" & r).Font.Bold = True
    
    ws.Columns("A:C").AutoFit
    r = r + 3
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_Tax_Note. Error: " & Err.Description
End Sub

Private Sub AutoNumber_Selected_Notes()
    On Error GoTo AutoNumError
    Dim wsSelect As Worksheet, lastRow As Long, i As Long, mainNoteCounter As Long, subNoteCounter As String, policyNoteNumber As String
    Set wsSelect = ThisWorkbook.Sheets("Selection_Sheet")
    lastRow = wsSelect.Cells(wsSelect.Rows.Count, "B").End(xlUp).Row
    wsSelect.Range("G2:G" & lastRow).ClearContents
    mainNoteCounter = 1
    policyNoteNumber = ""
    For i = 2 To lastRow
        If wsSelect.Range("F" & i).Value = "Yes" Then
            If InStr(1, wsSelect.Range("A" & i).Value, ".") > 0 And InStr(1, wsSelect.Range("A" & i).Value, "A.2.") = 0 Then
                wsSelect.Range("G" & i).Value = mainNoteCounter
                If wsSelect.Range("A" & i).Value = "A.2" Then policyNoteNumber = CStr(mainNoteCounter)
                mainNoteCounter = mainNoteCounter + 1
            End If
        End If
    Next i
    If policyNoteNumber <> "" Then
        subNoteCounter = "a"
        For i = 2 To lastRow
            If wsSelect.Range("F" & i).Value = "Yes" And InStr(1, wsSelect.Range("A" & i).Value, "A.2.") > 0 Then
                wsSelect.Range("G" & i).Value = policyNoteNumber & "." & subNoteCounter
                subNoteCounter = Chr(Asc(subNoteCounter) + 1)
            End If
        Next i
    End If
    Exit Sub
AutoNumError:
    Debug.Print "      ----> FAILED: AutoNumber_Selected_Notes. Error: " & Err.Description
End Sub

Private Sub Link_Note_Numbers_To_Statements()
    On Error GoTo LinkError
    Dim wsBS As Worksheet, wsPL As Worksheet, links As Object, key As Variant
    Set wsBS = ThisWorkbook.Sheets("Balance_Sheet")
    Set wsPL = ThisWorkbook.Sheets("Statement_of_PL")
    wsBS.Range("B8:B100").ClearContents: wsPL.Range("B8:B100").ClearContents
    Set links = CreateObject("Scripting.Dictionary")
    links.Add "B11", "C.1": links.Add "B12", "C.3": links.Add "B13", "C.4": links.Add "B15", "C.8"
    links.Add "B20", "C.5": links.Add "B21", "C.6": links.Add "B22", "C.7"
    links.Add "B31", "B.1": links.Add "B32", "B.2"
    links.Add "B38", "B.3": links.Add "B40", "B.6": links.Add "B41", "B.7"
    links.Add "B43", "B.4": links.Add "B44", "B.5"
    For Each key In links.Keys: wsBS.Range(key).Formula = "=IFERROR(VLOOKUP(""" & links(key) & """, Selection_Sheet!$A:$G, 7, FALSE), ""-"")": Next key
    links.RemoveAll
    links.Add "B8", "D.1": links.Add "B9", "D.2": links.Add "B12", "D.3"
    links.Add "B15", "D.4": links.Add "B16", "D.5": links.Add "B17", "D.6": links.Add "B18", "D.7"
    links.Add "B21", "D.8": links.Add "B25", "D.11": links.Add "B28", "D.10"
    For Each key In links.Keys: wsPL.Range(key).Formula = "=IFERROR(VLOOKUP(""" & links(key) & """, Selection_Sheet!$A:$G, 7, FALSE), ""-"")": Next key
    Exit Sub
LinkError:
    Debug.Print "    --> FAILED: Link_Note_Numbers_To_Statements. Error: " & Err.Description
End Sub

Private Sub Setup_CommonControlSheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    Dim labelsArr As Variant, valuesArr As Variant
    Dim strMajor As String, strMinor As String, strGrouping As String, strPolicies As String, strRP As String, strRPTxn As String
    ws.Cells.Clear
    labelsArr = Array("Entity Name:", "Address:", "CIN No.:", "Financial Year - Start:", "Financial Year - End:", "Currency:", "Units:", "Numbers Format:", "Negative Colour:", "Default Font:", "Default Font Size:")
    valuesArr = Array("[User Input]", "[User Input]", "[User Input]", CDate("2025-01-01"), CDate("2025-12-31"), "INR", "Millions", "Accounting", "Brackets", "Bookman Old Style", 11)
    With ws
        .Range("A1").Resize(UBound(labelsArr) + 1, 1).Value = Application.Transpose(labelsArr)
        .Range("B1").Resize(UBound(valuesArr) + 1, 1).Value = Application.Transpose(valuesArr)
        .Range("B4:B5").NumberFormat = "yyyy-mm-dd"
        .Range("C1:H1").Value = Array("Control List: Major Heads", "Control List: Minor Heads", "Control List: Grouping", "Control List: Accounting Policies", "Control List: Related Parties", "Control List: RP Txn Types")
        
        strMajor = "Property, Plant and Equipment|Intangible Assets|Non-current Investments|Long-term Loans and Advances|" & _
                   "Other Non-current Assets|Current Investments|Inventories|Trade Receivables|Cash and Cash Equivalents|" & _
                   "Short-term Loans and Advances|Other Current Assets|Equity Share Capital|Other Equity|Long-term Borrowings|" & _
                   "Deferred Tax Liabilities (Net)|Other Long-term Liabilities|Long-term Provisions|Short-term Borrowings|" & _
                   "Trade Payables|Other Current Liabilities|Short-term Provisions|Revenue from Operations|Other Income|" & _
                   "Cost of Materials Consumed|Purchases of Stock-in-Trade|Changes in Inventories|Employee Benefits Expense|" & _
                   "Finance Costs|Depreciation and Amortization|Other Expenses|Exceptional Items|Extraordinary Items|Taxes on Income|Prior Period Items"
        Call WriteUniqueList(ws.Range("C2"), strMajor)
        
        strMinor = "Tangible Assets|Intangible Assets|Financial Assets - Investments|Financial Assets - Loans|Other Non-current Assets|" & _
                   "Inventories|Financial Assets - Trade Receivables|Cash and Cash Equivalents|Financial Assets - Loans|" & _
                   "Other financial assets|Equity Share Capital|Other Equity|Financial Liabilities - Borrowings|Provisions|" & _
                   "Other financial liabilities|Financial Liabilities - Borrowings|Financial Liabilities - Trade Payables|" & _
                   "Other financial liabilities|Provisions|Revenue from Operations|Other Income|Cost of Materials Consumed|" & _
                   "Purchases of Stock-in-Trade|Changes in inventories of finished goods, work-in-progress and Stock-in-Trade|" & _
                   "Employee Benefit Expense|Finance Costs|Depreciation and Amortization Expense|Other Expenses"
        Call WriteUniqueList(ws.Range("D2"), strMinor)
        
        strGrouping = "Land|Building|Plant and Machinery|Furniture and Fixtures|Vehicles|Office Equipment|Capital Work-in-Progress|" & _
                      "Goodwill|Patents, Copyrights, Trademarks|Intangible assets under development|Financial Investments - Mutual funds|" & _
                      "Financial Investments - Equity instruments|Financial Investments - Others|Loans to related parties|Loans to others|" & _
                      "Other non-current assets|Raw materials|Work-in-progress|Finished goods|Stock-in-trade|Stores and spares|Loose tools|" & _
                      "Trade receivables outstanding > 6 months|Trade receivables outstanding < 6 months|Balances with banks|" & _
                      "Cheques, drafts on hand|Cash on hand|Other bank balances|Loans to related parties|Loans to others|Security deposits|" & _
                      "Other current assets|Retained Earnings|General Reserve|Securities Premium|Debentures/Bonds|Term Loans from Banks|" & _
                      "Term Loans from others|Deferred tax liability|Provision for employee benefits|Other provisions|Borrowings from Banks|" & _
                      "Borrowings from others|Trade Payables - MSMEs|Trade Payables - Others|Current maturities of long-term debt|" & _
                      "Interest accrued|Unpaid dividends|Other payables|Provision for employee benefits|Provision for tax|Other provisions|" & _
                      "Sale of products|Sale of services|Other operating revenues|Interest Income|Dividend Income|Net gain/loss on sale of investments|" & _
                      "Other non-operating income|Raw material consumed|Purchase of stock-in-trade|Salaries and wages|" & _
                      "Contribution to provident and other funds|Staff welfare expenses|Interest expense|Other borrowing costs|" & _
                      "Depreciation on tangible assets|Amortization on intangible assets|Rent|Rates and taxes|Power and fuel|Repairs to buildings|" & _
                      "Repairs to machinery|Insurance|Auditor's remuneration|Legal and professional fees|Corporate Social Responsibility (CSR) expense|Miscellaneous expenses"
        Call WriteUniqueList(ws.Range("E2"), strGrouping)
        
        strPolicies = "Revenue recognition (AS 9)|Property, Plant and Equipment (PPE) (AS 10)|Intangible assets (AS 26)|" & _
                      "Impairment of assets (AS 28)|Inventories valuation (AS 2)|Investments (AS 13)|" & _
                      "Foreign currency transactions (AS 11)|Employee benefits (AS 15)|Borrowing costs (AS 16)|" & _
                      "Provisions and contingencies (AS 29)|Taxes on income (AS 22)|Government grants (AS 12)|" & _
                      "Leases (AS 19)|Segment reporting (AS 17)|Cash flow statement (AS 3)"
        Call WriteUniqueList(ws.Range("F2"), strPolicies)

        strRP = "Holding company|Subsidiaries|Associates|Joint ventures|Key management personnel (KMP)|Relatives of KMP|Entities controlled by KMP"
        Call WriteUniqueList(ws.Range("G2"), strRP)
        
        strRPTxn = "Sale of goods|Purchase of goods|Sale of services|Purchase of services|Remuneration to KMP|Rent paid|Rent received|Dividend paid|Dividend received|Interest paid|Interest received|Loan given|Loan taken"
        Call WriteUniqueList(ws.Range("H2"), strRPTxn)

        .Range("A:A, C1:H1").Font.Bold = True: .Columns("A:K").AutoFit
    End With
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_CommonControlSheet. Error: " & Err.Description
End Sub

Private Sub WriteUniqueList(ByVal targetCell As Range, ByVal delimitedString As String)
    Dim dict As Object, item As Variant, arr As Variant
    Set dict = CreateObject("Scripting.Dictionary")
    dict.CompareMode = vbTextCompare
    
    arr = Split(delimitedString, "|")
    For Each item In arr
        If Trim(item) <> "" And Not dict.Exists(Trim(item)) Then
            dict.Add Trim(item), 1
        End If
    Next item
    
    If dict.Count > 0 Then
        targetCell.Resize(dict.Count, 1).Value = Application.Transpose(dict.Keys)
    End If
End Sub

Private Sub Setup_InputTrialBalanceSheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    Dim tbl As ListObject
    ws.Cells.Clear
    
    ' Define headers
    Dim headers() As String
    ReDim headers(0 To 9)
    headers(0) = "Ledger Name"
    headers(1) = "Opening Balance (CY)"
    headers(2) = "Debit (CY)"
    headers(3) = "Credit (CY)"
    headers(4) = "Closing Balance (CY)"
    headers(5) = "Closing Balance (PY)"
    headers(6) = "Type (BS/PL)"
    headers(7) = "Major Head"
    headers(8) = "Minor Head"
    headers(9) = "Grouping"

    ws.Range("A1").Resize(1, 10).Value = headers
    ws.Range("A1:J1").Font.Bold = True
    
    ' Create the table
    Set tbl = ws.ListObjects.Add(xlSrcRange, ws.Range("A1:J1"), , xlYes)
    tbl.Name = "tblTrialBalance"
    
    ' **FIX START**: Temporarily add a row to ensure DataBodyRange exists for validation
    tbl.ListRows.Add
    
    ' Apply formulas and validation
    tbl.ListColumns("Closing Balance (CY)").DataBodyRange.Formula = "=[@[Opening Balance (CY)]]+[@[Debit (CY)]]-[@[Credit (CY)]]"
    
    With tbl.ListColumns("Type (BS/PL)").DataBodyRange.Validation
        .Delete
        .Add Type:=xlValidateList, Formula1:="BS,PL"
        .IgnoreBlank = True
    End With
    With tbl.ListColumns("Major Head").DataBodyRange.Validation
        .Delete
        .Add Type:=xlValidateList, Formula1:="=MajorHeads"
        .IgnoreBlank = True
    End With
    With tbl.ListColumns("Minor Head").DataBodyRange.Validation
        .Delete
        .Add Type:=xlValidateList, Formula1:="=MinorHeads"
        .IgnoreBlank = True
    End With
    With tbl.ListColumns("Grouping").DataBodyRange.Validation
        .Delete
        .Add Type:=xlValidateList, Formula1:="=Groupings"
        .IgnoreBlank = True
    End With
    
    ' **FIX END**: Remove the temporary row
    tbl.ListRows(1).Delete
    
    ws.Columns("A:J").AutoFit
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_InputTrialBalanceSheet. Error: " & Err.Description
    MsgBox "An error occurred in Setup_InputTrialBalanceSheet: " & Err.Description, vbCritical
End Sub

Private Sub Setup_InputShareCapitalSheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    ws.Cells.Clear
    ws.Range("A1").Value = "Authorised Capital": ws.Range("A1:E1").Font.Bold = True
    ws.Range("A2:E2").Value = Array("Class of Share", "Number of Shares", "Face Value", "Amount (CY)", "Amount (PY)")
    ws.Range("A3").Value = "Equity Shares": ws.Range("B3:C3").Value = Array(1000000, 10)
    ws.Range("D3").Formula = "=B3*C3": ws.Range("E3").Formula = "=B3*C3"
    
    ws.Range("A6").Value = "Reconciliation of Shares Outstanding": ws.Range("A6:C6").Font.Bold = True
    ws.Range("A7:C7").Value = Array("Particulars", "Number of Shares (CY)", "Number of Shares (PY)")
    ws.Range("A8:A10").Value = Application.Transpose(Array("Opening Balance", "Shares issued during the year", "Closing Balance"))
    ws.Range("B8:C9").Value = 0
    ws.Range("B10").Formula = "=B8+B9": ws.Range("C10").Formula = "=C8+C9"
    ws.Range("D8").Formula = "=B8*C3": ws.Range("E8").Formula = "=C8*C3"
    ws.Range("D9").Formula = "=B9*C3": ws.Range("E9").Formula = "=C9*C3"
    ws.Range("D10").Formula = "=D8+D9": ws.Range("E10").Formula = "=E8+E9"

    ws.Range("A13").Value = "Shareholders holding more than 5% of shares": ws.Range("A13:D13").Font.Bold = True
    ws.Range("A14:D14").Value = Array("Name of Shareholder", "No. of Shares (CY)", "% Holding (CY)", "No. of Shares (PY)")
    ws.Range("C15").Formula = "=IFERROR(B15/$B$10,0)": ws.Range("C16").Formula = "=IFERROR(B16/$B$10,0)"
    
    ws.Range("C15:C16").NumberFormat = "0.00%"
    ws.Range("A:E").Font.Bold = False
    ws.Range("A1,A2:E2,A6,A7:C7,A13,A14:D14").Font.Bold = True
    ws.Columns("A:E").AutoFit
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_InputShareCapitalSheet. Error: " & Err.Description
End Sub

Private Sub Setup_InputPPEScheduleSheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    With ws
        .Cells.Clear: .Range("A1:G1").Value = Array("Asset Class", "Opening Gross Block", "Additions", "Disposals (Gross)", "Opening Acc. Depreciation", "Depreciation for Year", "Acc. Depr. on Disposals")
        .Range("A1:G1").Font.Bold = True: .Columns("A:G").AutoFit
        .Range("A2:A3").Value = Application.Transpose(Array("Building", "Plant and Machinery"))
        .Range("B2:G3").Value = 0: .Range("B2:G3").NumberFormat = "#,##0"
    End With
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_InputPPEScheduleSheet. Error: " & Err.Description
End Sub

Private Sub Setup_InputCWIPScheduleSheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    With ws
        .Cells.Clear
        .Range("A1").Value = "Part A: CWIP Movement": .Range("A1:C1").Font.Bold = True
        .Range("A2:C2").Value = Array("Particulars", "Amount (CY)", "Amount (PY)")
        .Range("A3:A6").Value = Application.Transpose(Array("Opening Balance", "Additions during the year", "Capitalized during the year", "Closing Balance"))
        .Range("B3:C5").Value = 0
        .Range("B6").Formula = "=B3+B4-B5": .Range("C6").Formula = "=C3+C4-C5"
        .Range("A2:C2, A6, B6, C6").Font.Bold = True
        
        .Range("A8").Value = "Part B: Aging of Closing CWIP Balance (CY)": .Range("A8").Font.Bold = True
        .Range("A9:B9").Value = Array("Aging Bucket", "Amount")
        .Range("A10:A13").Value = Application.Transpose(Array("< 1 Year", "1-2 Years", "2-3 Years", "> 3 Years"))
        .Range("A9:B9").Font.Bold = True
        .Range("B14").Formula = "=SUM(B10:B13)": .Range("A14,B14").Font.Bold = True: .Range("A14").Value = "Total"
        
        .Range("B3:C14").NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
        .Columns("A:C").AutoFit
    End With
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_InputCWIPScheduleSheet. Error: " & Err.Description
End Sub

Private Sub Setup_InputIntangibleScheduleSheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    With ws
        .Cells.Clear
        .Range("A1").Value = "Part A: Intangible Assets (Completed)": .Range("A1").Font.Bold = True
        .Range("A2:G2").Value = Array("Asset Class", "Opening Gross Block", "Additions", "Disposals (Gross)", "Opening Acc. Amortization", "Amortization for Year", "Acc. Amort. on Disposals")
        .Range("A2:G2").Font.Bold = True
        .Range("A3:A4").Value = Application.Transpose(Array("Goodwill", "Patents, Copyrights, Trademarks"))
        .Range("B3:G4").Value = 0: .Range("B3:G4").NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
        
        .Range("A7").Value = "Part B: Intangible Assets under Development": .Range("A7").Font.Bold = True
        .Range("D7").Value = "Aging of Closing Balance (CY)": .Range("D7").Font.Bold = True
        
        .Range("A8:B8").Value = Array("Movement", "Amount"): .Range("A8:B8").Font.Bold = True
        .Range("A9:A12").Value = Application.Transpose(Array("Opening Balance", "Additions", "Capitalized/Transferred", "Closing Balance"))
        .Range("B9:B11").Value = 0: .Range("B12").Formula = "=B9+B10-B11"
        .Range("A12,B12").Font.Bold = True
        
        .Range("D8:E8").Value = Array("Aging Bucket", "Amount"): .Range("D8:E8").Font.Bold = True
        .Range("D9:D12").Value = Application.Transpose(Array("< 1 Year", "1-2 Years", "2-3 Years", "> 3 Years"))
        .Range("E13").Formula = "=SUM(E9:E12)": .Range("D13,E13").Font.Bold = True: .Range("D13").Value = "Total"
        
        .Range("B9:B12, E9:E13").NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
        .Columns.AutoFit
    End With
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_InputIntangibleScheduleSheet. Error: " & Err.Description
End Sub

Private Sub Setup_InputRelatedPartySheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    Dim tbl As ListObject
    ws.Cells.Clear
    On Error Resume Next
    ws.ListObjects("tblRelatedParty").Delete
    On Error GoTo SetupError
    
    Set tbl = ws.ListObjects.Add(xlSrcRange, ws.Range("A1:G1"), , xlYes)
    tbl.Name = "tblRelatedParty"
    tbl.HeaderRowRange.Value = Array("Related Party Name", "Relationship", "Transaction Type", "Amount (CY)", "Amount (PY)", "Balance Outstanding (CY)", "Balance Outstanding (PY)")
    
    With tbl.ListColumns("Relationship").DataBodyRange.Validation
        .Delete: .Add Type:=xlValidateList, Formula1:="=RelatedParties": .IgnoreBlank = True
    End With
    With tbl.ListColumns("Transaction Type").DataBodyRange.Validation
        .Delete: .Add Type:=xlValidateList, Formula1:="=RPTransactionTypes": .IgnoreBlank = True
    End With
    
    tbl.HeaderRowRange.Font.Bold = True
    ws.Columns("A:G").AutoFit
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_InputRelatedPartySheet. Error: " & Err.Description
End Sub

Private Sub Setup_InputContingentLiabSheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    Dim tbl As ListObject
    ws.Cells.Clear
    On Error Resume Next
    ws.ListObjects("tblContingentLiab").Delete
    On Error GoTo SetupError
    
    Set tbl = ws.ListObjects.Add(xlSrcRange, ws.Range("A1:D1"), , xlYes)
    tbl.Name = "tblContingentLiab"
    tbl.HeaderRowRange.Value = Array("Particulars", "Type", "Amount (CY)", "Amount (PY)")
    
    With tbl.ListColumns("Type").DataBodyRange.Validation
        .Delete: .Add Type:=xlValidateList, Formula1:="Contingent Liability,Commitment": .IgnoreBlank = True
    End With
    
    tbl.HeaderRowRange.Font.Bold = True
    ws.Columns("A:D").AutoFit
    ws.Columns("A").ColumnWidth = 60
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_InputContingentLiabSheet. Error: " & Err.Description
End Sub

Private Sub Setup_InputInvestmentsSheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    Dim tbl As ListObject
    ws.Cells.Clear
    On Error Resume Next
    ws.ListObjects("tblInvestments").Delete
    On Error GoTo SetupError
    
    Set tbl = ws.ListObjects.Add(xlSrcRange, ws.Range("A1:D1"), , xlYes)
    tbl.Name = "tblInvestments"
    tbl.HeaderRowRange.Value = Array("Investment Particulars", "Classification", "Cost (CY)", "Cost (PY)")
    
    With tbl.ListColumns("Classification").DataBodyRange.Validation
        .Delete: .Add Type:=xlValidateList, Formula1:="Current,Non-Current": .IgnoreBlank = True
    End With
    
    tbl.HeaderRowRange.Font.Bold = True
    ws.Columns("A:D").AutoFit
    ws.Columns("A").ColumnWidth = 50
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_InputInvestmentsSheet. Error: " & Err.Description
End Sub

Private Sub Setup_InputEmployeeBenefitsSheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    ws.Cells.Clear
    ' Defined Contribution Plan
    ws.Range("A1").Value = "Defined Contribution Plan (Amounts recognized in P&L)": ws.Range("A1:C1").Font.Bold = True
    ws.Range("A2").Value = "Employer's Contribution to Provident Fund"
    ws.Range("B1:C1").Value = Array("Current Year", "Previous Year")
    ws.Range("B2:C2").Value = 0
    
    ' Defined Benefit Plan
    ws.Range("A5").Value = "Defined Benefit Plan - Gratuity (Unfunded)": ws.Range("A5:C5").Font.Bold = True
    ws.Range("A6").Value = "Net Employee Benefit Expense (Recognised in P&L)": ws.Range("A6:C6").Font.Bold = True
    ws.Range("A7:A9").Value = Application.Transpose(Array("Current Service Cost", "Interest Cost", "Actuarial (gain) / loss"))
    ws.Range("B7:C9").Value = 0
    
    ws.Range("A12").Value = "Balance Sheet Reconciliation": ws.Range("A12:C12").Font.Bold = True
    ws.Range("A13:A14").Value = Application.Transpose(Array("Present value of obligation", "Plan assets"))
    ws.Range("B13:C14").Value = 0
    
    ws.Range("A:A").ColumnWidth = 45
    ws.Range("B:C").ColumnWidth = 20
    ws.Range("B2:C2, B7:C9, B13:C14").NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_InputEmployeeBenefitsSheet. Error: " & Err.Description
End Sub

Private Sub Setup_InputTaxesSheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    ws.Cells.Clear
    ' Components
    ws.Range("A1").Value = "Components of Tax Expense": ws.Range("A1:C1").Font.Bold = True
    ws.Range("B1:C1").Value = Array("Current Year", "Previous Year")
    ws.Range("A2:A3").Value = Application.Transpose(Array("Current Tax", "Deferred Tax"))
    ws.Range("B2:C3").Value = 0
    
    ' Reconciliation
    ws.Range("A5").Value = "Tax Reconciliation (Current Year)": ws.Range("A5:B5").Font.Bold = True
    ws.Range("A6").Value = "Applicable Tax Rate (%)": ws.Range("B6").Value = 0.25: ws.Range("B6").NumberFormat = "0.00%"
    ws.Range("A7").Value = "Tax effect of non-deductible expenses": ws.Range("B7").Value = 0
    ws.Range("A8").Value = "Tax effect of other differences": ws.Range("B8").Value = 0
    
    ws.Range("A:A").ColumnWidth = 40
    ws.Range("B:C").ColumnWidth = 20
    ws.Range("B2:C3, B7:B8").NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_InputTaxesSheet. Error: " & Err.Description
End Sub

Private Sub Setup_InputLedgerSheets()
    On Error GoTo SetupError
    Dim ws As Worksheet, reportDateFormula As String
    reportDateFormula = "Common_Control_Sheet!$B$5"
    
    ' Setup Receivables Ledger
    Set ws = ThisWorkbook.Sheets("Input_Receivables_Ledger")
    ws.Cells.Clear
    With ws
        .Range("A1:I1").Value = Array("Customer Name", "Invoice No.", "Invoice Date", "Invoice Amount", "Amount Settled", "Outstanding Amount", "Disputed (Yes/No)", "Days Outstanding", "Aging Bucket")
        .Range("A1:I1").Font.Bold = True
        .Range("F2:F51").Formula = "=IF(D2<>"""",D2-E2,"""")"
        .Range("H2:H51").Formula = "=IF(AND(F2>0, ISNUMBER(C2))," & reportDateFormula & "-C2, """")"
        .Range("I2:I51").Formula = "=IF(H2<>"""",IF(H2>1095,""> 3 Years"",IF(H2>730,""2-3 Years"",IF(H2>365,""1-2 Years"",IF(H2>182,""182-365 Days"",""< 182 Days"")))),"""")"
        With .Range("G2:G51").Validation
            .Delete: .Add Type:=xlValidateList, Formula1:="Yes,No": .IgnoreBlank = True
        End With
        .Columns("A:I").AutoFit
    End With
    
    ' Setup Payables Ledger
    Set ws = ThisWorkbook.Sheets("Input_Payables_Ledger")
    ws.Cells.Clear
    With ws
        .Range("A1:I1").Value = Array("Vendor Name", "Invoice No.", "Invoice Date", "Invoice Amount", "Amount Settled", "Outstanding Amount", "Disputed (Yes/No)", "Payable Type (MSME/Other)", "Aging Bucket")
        .Range("A1:I1").Font.Bold = True
        .Range("F2:F51").Formula = "=IF(D2<>"""",D2-E2,"""")"
        .Range("I2:I51").Formula = "=IF(F2>0,IF(" & reportDateFormula & "-C2>1095,""> 3 Years"",IF(" & reportDateFormula & "-C2>730,""2-3 Years"",IF(" & reportDateFormula & "-C2>365,""1-2 Years"",IF(" & reportDateFormula & "-C2>182,""182-365 Days"",""< 182 Days"")))),"""")"
        With .Range("G2:G51").Validation
            .Delete: .Add Type:=xlValidateList, Formula1:="Yes,No": .IgnoreBlank = True
        End With
        With .Range("H2:H51").Validation
            .Delete: .Add Type:=xlValidateList, Formula1:="MSME,Other": .IgnoreBlank = True
        End With
        .Columns("A:I").AutoFit
    End With
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_InputLedgerSheets. Error: " & Err.Description
End Sub

Private Sub Setup_SelectionSheet(ByVal ws As Worksheet)
    On Error GoTo SetupError
    Dim allNotesString As String, notesArray As Variant, i As Integer, noteDetail As Variant, strPart1 As String, strPart2 As String, strPart3 As String, strPart4 As String
    ws.Cells.Clear
    
    strPart1 = "A|General notes and policies (mandatory)|~A.1|Corporate information and basis of preparation|~A.2|Significant accounting policies|~" & _
        "A.2.1|Revenue recognition (AS 9)|Revenue from Operations~A.2.2|Property, Plant and Equipment (PPE) and depreciation (AS 10)|Property, Plant and Equipment~" & _
        "A.2.3|Intangible assets and amortization (AS 26)|Intangible Assets~A.2.4|Impairment of assets (AS 28)|~" & _
        "A.2.5|Inventories valuation and cost formula (AS 2)|Inventories~A.2.6|Investments classification and valuation (AS 13)|Non-current Investments~" & _
        "A.2.7|Foreign currency transactions and translation (AS 11)|~A.2.8|Employee benefits (AS 15)|Employee Benefits Expense~" & _
        "A.2.9|Borrowing costs and capitalization policy (AS 16)|Finance Costs~A.2.10|Provisions, contingent liabilities, contingent assets (AS 29)|Long-term Provisions~" & _
        "A.2.11|Taxes on income (current/deferred; AS 22)|Taxes on Income~A.2.12|Government grants (AS 12)|~A.2.13|Construction contracts revenue (AS 7)|~" & _
        "A.2.14|Leases classification (AS 19)|~A.2.15|Segment reporting basis (AS 17)|~A.2.16|Cash and cash equivalents definition (AS 3)|Cash and Cash Equivalents"

    strPart2 = "B|Equity and liabilities notes|~B.1|Share capital|Equity Share Capital~B.2|Reserves and surplus / other equity|Other Equity~" & _
        "B.3|Long-term and short-term borrowings|Long-term Borrowings~B.4|Trade payables|Trade Payables~B.5|Other financial liabilities and provisions|Other Current Liabilities~" & _
        "B.6|Other non-financial liabilities|Other Long-term Liabilities~B.7|Employee benefit obligations (AS 15)|Long-term Provisions~" & _
        "C|Assets notes|~C.1|Property, plant and equipment (AS 10 + Schedule III)|Property, Plant and Equipment~C.2|Capital work-in-progress (CWIP)|~" & _
        "C.3|Intangible assets and Intangible assets under development|Intangible Assets~C.4|Investments (AS 13)|Non-current Investments~" & _
        "C.5|Inventories (AS 2)|Inventories~C.6|Trade receivables|Trade Receivables~C.7|Cash and cash equivalents|Cash and Cash Equivalents~" & _
        "C.8|Loans, advances, and other assets|Long-term Loans and Advances"

    strPart3 = "D|Profit and Loss notes|~D.1|Revenue from operations (AS 9)|Revenue from Operations~D.2|Other income|Other Income~" & _
        "D.3|Cost of materials consumed; Purchases; Changes in inventories|Cost of Materials Consumed~D.4|Employee benefits expense (AS 15)|Employee Benefits Expense~" & _
        "D.5|Finance costs (AS 16)|Finance Costs~D.6|Depreciation and amortization expense|Depreciation and Amortization~" & _
        "D.7|Other expenses (incl. CSR, Auditor Payments)|Other Expenses~D.8|Exceptional items and extraordinary items (AS 5)|Exceptional Items~" & _
        "D.9|Prior period items disclosure (AS 5)|Prior Period Items~D.10|Earnings per share (AS 20)|~D.11|Income taxes (AS 22)|Taxes on Income~" & _
        "E|AS-specific and cross-cutting disclosures|~E.1|AS 3 Cash Flow Statement details|~E.2|Events occurring after the balance sheet date|~" & _
        "E.3|AS 18 Related party disclosures|~E.4|AS 19 Leases|~E.5|Contingent Liabilities and Commitments (AS 29)"
        
    strPart4 = "F|Additional Schedule III (2021) Disclosures|~F.1|Utilization of borrowed funds and share premium|~F.2|Title deeds of immovable properties not in company’s name|~" & _
        "F.3|Proceedings for Benami property|~F.4|Wilful defaulter status|~F.5|Relationship with struck-off companies|~F.6|Crypto/virtual currency holdings|~" & _
        "F.7|Undisclosed income surrendered in tax assessments|~F.8|Ratios with variance >25% explanations|~" & _
        "F.9|Aging schedules: Receivables, Payables, CWIP, Intangibles under dev.|~F.10|Unspent CSR amounts|~G|Other Statutory Disclosures|~" & _
        "G.1|Managerial remuneration (Section 197)|~G.2|MSME Disclosures (Principal and Interest due)|"

    allNotesString = strPart1 & "~" & strPart2 & "~" & strPart3 & "~" & strPart4
    notesArray = Split(allNotesString, "~")
    
    With ws
        .Range("A1:G1").Value = Split("Note Ref|Note/Schedule Description|Linked Major Head|System Rec. (Y/N)|User Selection (Y/N)|Final (Y/N)|Auto-Number", "|"): .Range("A1:G1").Font.Bold = True
        For i = 0 To UBound(notesArray)
            If Trim(notesArray(i)) <> "" Then
                noteDetail = Split(notesArray(i), "|")
                If UBound(noteDetail) >= 0 Then .Cells(i + 2, 1).Value = noteDetail(0)
                If UBound(noteDetail) >= 1 Then .Cells(i + 2, 2).Value = noteDetail(1)
                If UBound(noteDetail) >= 2 Then .Cells(i + 2, 3).Value = noteDetail(2)
                If InStr(1, CStr(.Cells(i + 2, 1).Value), ".") = 0 Then .Rows(i + 2).Font.Bold = True
            End If
        Next i
        Dim lastNoteRow As Long: lastNoteRow = .Cells(.Rows.Count, "B").End(xlUp).Row
        With .Range("E2:E" & lastNoteRow).Validation: .Delete: .Add Type:=xlValidateList, Formula1:="Yes,No": .IgnoreBlank = True: End With
        .Range("F2:F" & lastNoteRow).Formula = "=IF(E2=""Yes"",""Yes"",IF(AND(E2="""",D2=""Yes""),""Yes"",""No""))"
        .Columns("C").Hidden = True: .Columns("A:G").AutoFit: .Columns("B").ColumnWidth = 60
    End With
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_SelectionSheet. Error: " & Err.Description
End Sub

Private Sub Update_System_Recommendations()
    On Error GoTo UpdateError
    Dim wsSelect As Worksheet, wsTB As Worksheet, lastSelectRow As Long, i As Long, majorHead As String, majorHeadsRange As Range
    Set wsSelect = ThisWorkbook.Sheets("Selection_Sheet"): Set wsTB = ThisWorkbook.Sheets("Input_Trial_Balance")
    lastSelectRow = wsSelect.Cells(wsSelect.Rows.Count, "C").End(xlUp).Row
    
    On Error Resume Next
    Set majorHeadsRange = wsTB.ListObjects("tblTrialBalance").ListColumns("Major Head").DataBodyRange
    If majorHeadsRange Is Nothing Then
        wsSelect.Range("D2:D" & lastSelectRow).Value = "No"
        Exit Sub
    End If
    On Error GoTo UpdateError
    
    wsSelect.Range("D2:D" & lastSelectRow).Value = "No"
    For i = 2 To lastSelectRow
        majorHead = wsSelect.Range("C" & i).Value
        If Not IsEmpty(majorHead) Then
            If Application.WorksheetFunction.CountIf(majorHeadsRange, majorHead) > 0 Then wsSelect.Range("D" & i).Value = "Yes"
        End If
    Next i
    wsSelect.Range("D" & wsSelect.Range("A:A").Find("E.3", LookIn:=xlValues, lookat:=xlWhole).Row).Value = "Yes"
    wsSelect.Range("D" & wsSelect.Range("A:A").Find("E.5", LookIn:=xlValues, lookat:=xlWhole).Row).Value = "Yes"
    wsSelect.Range("D" & wsSelect.Range("A:A").Find("F.9", LookIn:=xlValues, lookat:=xlWhole).Row).Value = "Yes"
    wsSelect.Range("D" & wsSelect.Range("A:A").Find("F.8", LookIn:=xlValues, lookat:=xlWhole).Row).Value = "Yes"
    Exit Sub
UpdateError:
    Debug.Print "    --> FAILED: Update_System_Recommendations. Error: " & Err.Description
End Sub

Private Sub Setup_FinancialStatementSheets(ByVal wsControl As Worksheet)
    On Error GoTo SetupError
    Dim sheetNames As Variant, ws As Worksheet, sheetName As Variant
    sheetNames = Array("Balance_Sheet", "Statement_of_PL", "Cash_Flow_Statement", "Notes_to_Accounts")
    For Each sheetName In sheetNames
        If SheetExists(sheetName) Then
            Set ws = ThisWorkbook.Sheets(sheetName)
            With ws
                .Cells.Clear: .Range("A1").Formula = "=''" & wsControl.Name & "''!B1": .Range("A2").Formula = "=''" & wsControl.Name & "''!B2": .Range("A3").Formula = "=''" & wsControl.Name & "''!B3"
                Select Case sheetName
                    Case "Balance_Sheet": .Range("A5").Formula = "=""Balance Sheet as at "" & TEXT(''" & wsControl.Name & "''!B5, ""mmmm dd, yyyy"")"
                    Case "Statement_of_PL": .Range("A5").Formula = "=""Statement of Profit and Loss for the year ended "" & TEXT(''" & wsControl.Name & "''!B5, ""mmmm dd, yyyy"")"
                    Case "Cash_Flow_Statement": .Range("A5").Formula = "=""Cash Flow Statement for the year ended "" & TEXT(''" & wsControl.Name & "''!B5, ""mmmm dd, yyyy"")"
                    Case "Notes_to_Accounts": .Range("A5").Value = "Notes to Financial Statements"
                End Select
                .Range("A1:A5").Font.Bold = True: .Columns("A").AutoFit
            End With
        End If
    Next sheetName
    Exit Sub
SetupError:
    Debug.Print "    --> FAILED: Setup_FinancialStatementSheets. Error: " & Err.Description
End Sub

Private Sub Set_Default_Font(ByVal wsControl As Worksheet)
    On Error GoTo FontError
    Dim ws As Worksheet, defaultFont As String, defaultFontSize As Single
    defaultFont = wsControl.Range("B10").Value: defaultFontSize = wsControl.Range("B11").Value
    If defaultFont = "" Then defaultFont = "Bookman Old Style"
    If defaultFontSize = 0 Then defaultFontSize = 11
    Application.ScreenUpdating = False
    For Each ws In ThisWorkbook.Worksheets: ws.Cells.Font.Name = defaultFont: ws.Cells.Font.Size = defaultFontSize: Next ws
    Application.ScreenUpdating = True
    Exit Sub
FontError:
    Debug.Print "  -> FAILED: Set_Default_Font. Error: " & Err.Description
End Sub

Private Function SheetExists(ByVal sheetName As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(sheetName)
    If Not ws Is Nothing Then SheetExists = True
    On Error GoTo 0
End Function

Private Sub Create_Note_From_Groupings(ByVal ws As Worksheet, ByRef r As Long, ByVal noteNum As String, ByVal noteTitle As String, ByVal majorHead As String, ByVal isCredit As Boolean)
    On Error GoTo NoteError
    Dim wsTB As Worksheet, uniqueGroupings As Object, cell As Range, groupingName As Variant, startRow As Long, groupingsRange As Range
    Set wsTB = ThisWorkbook.Sheets("Input_Trial_Balance"): Set uniqueGroupings = CreateObject("Scripting.Dictionary")
    uniqueGroupings.CompareMode = vbTextCompare
    
    On Error Resume Next
    Set groupingsRange = wsTB.ListObjects("tblTrialBalance").ListColumns("Grouping").DataBodyRange
    If groupingsRange Is Nothing Then Exit Sub
    On Error GoTo NoteError
    
    For Each cell In groupingsRange
        If cell.Offset(0, -1).Value = majorHead And Trim(cell.Value) <> "" Then uniqueGroupings(Trim(cell.Value)) = 1
    Next cell
    If uniqueGroupings.Count = 0 Then Exit Sub
    
    ws.Range("A" & r).Value = "Note " & noteNum & ": " & noteTitle: ws.Range("A" & r).Font.Bold = True: r = r + 1
    ws.Range("A" & r).Resize(1, 3).Value = Array("Particulars", "Current Year", "Previous Year"): ws.Range("A" & r, "C" & r).Font.Bold = True
    startRow = r + 1: r = r + 1
    For Each groupingName In uniqueGroupings.Keys
        ws.Cells(r, "A").Value = groupingName
        If isCredit Then
            ws.Cells(r, "B").Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], """ & majorHead & """, tblTrialBalance[Grouping], """ & groupingName & """)"
            ws.Cells(r, "C").Formula = "=-SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], """ & majorHead & """, tblTrialBalance[Grouping], """ & groupingName & """)"
        Else
            ws.Cells(r, "B").Formula = "=SUMIFS(tblTrialBalance[Closing Balance (CY)], tblTrialBalance[Major Head], """ & majorHead & """, tblTrialBalance[Grouping], """ & groupingName & """)"
            ws.Cells(r, "C").Formula = "=SUMIFS(tblTrialBalance[Closing Balance (PY)], tblTrialBalance[Major Head], """ & majorHead & """, tblTrialBalance[Grouping], """ & groupingName & """)"
        End If
        r = r + 1
    Next groupingName
    ws.Cells(r, "A").Value = "Total": ws.Cells(r, "A").Font.Bold = True
    ws.Cells(r, "B").Formula = "=SUM(B" & startRow & ":B" & r - 1 & ")": ws.Cells(r, "B").Font.Bold = True
    ws.Cells(r, "C").Formula = "=SUM(C" & startRow & ":C" & r - 1 & ")": ws.Cells(r, "C").Font.Bold = True
    ws.Range("B" & startRow & ":C" & r).NumberFormat = "_(* #,##0.00_);_(* (#,##0.00);_(* ""-""??_);_(@_)"
    ws.Range("A" & startRow - 1 & ":C" & r).Borders.LineStyle = xlContinuous
    ws.Columns("A:C").AutoFit
    r = r + 3
    Exit Sub
NoteError:
    Debug.Print "      ----> FAILED: Create_Note_From_Groupings for " & noteTitle & ". Error: " & Err.Description
End Sub

