# User Inputs Record

- We had updated the masters extensively yesterday, pls check if they had also been reset because I cannot see them. As a result classification is not taking place properly. Go through Postgres files to find the missing entries. Check properly and not like yesterday where eventally I had to located it and tell you where to look for them.
- It is affecting not only AR AP inpur sheet, mapping suggestions are significantly impacted due to it.
- Create a document conversation.md and start sotring/entering every input I provide there. Store as it is without any changes.
- The masters were global and not entity specific, so I dont understand how they were impacted by yesterday's issue
- I don't think it is going to work this way. Leave it, I'll provide the details again to update the masters.
- Also, why add to your knowledge in the agent browser that for every project/workspace/playground etc you'll always create a conversations file and store my inputs there word by word.
- I meant agent manager
- Restart the servers
- Add below groupings in Other Expenses:
Bad Debts & Provisions
Administrative & Office Expenses
Communication & IT Expenses
Legal, Professional & Consultancy Fees
Printing, Stationery & Courier
Travel, Conveyance & Vehicle Expenses
Repairs & Maintenance
Sales, Marketing & Promotion Expenses
Commission & Brokerage
Logistics, Freight & Transportation
Statutory Levies, Taxes & Penalties
Recruitment and Training Expenses
CSR & Donations 
Losses, Write-offs & Exceptional Items
Foreign Exchange Loss
Online Selling Expenses
Lease Expenses - Land & Building
Lease Expenses - Plant and Machinery
Marine Insurance
Stock Insurance
Employee Insurance

Add below groupings in Employee Benefits Expenses:
Employee Salaries
Wages
Directors Salary
Employee Insurance
Director's Insurance
Staff Welfare Expenses
Bonus
Labour Charges

These should be part of global masters. 

Also check and confirm if the manual mapping feedback logic for gemini that was coded yesterday is still there or it has also vanished
- Is the restart done??
- But the new additions to the groupings are not not visible in the view masters section. I clicked on Reset Masters (Sync to Standard Groupings) but nothing happened.
- Add head Salary Payable and Expenses Payable under Other Current Liabilities
- Not visible, tried resyn- Decimals and comma issue still there, check screenshots
- Give me a groupings wise schedule as to which grouping is mapped to which all schedules on the Schedules Entry page
- I need to granularly for each grouping name and not head wise
- Is the commas and decimals issue resolved as its still not visible correctly, pls check.
- Changed number formatting style in entity info to european but it did not taken affect even after doing a redo of the autofill. Besides these changes should take effect without having to click anywhere, it was happening like this earlier but not anymore
- Yu have goofed up somewhere, Auto-fill button is no longer working. Further, Rounding unit for reports is ones, in equity share capital it is showing as 100000 (complete figure) whereas in Trade Payable it is showing as 7. Still not updating to European style.
- Restart the server

- Auto-fill all has stopped working again
- Still not working
- So basically auto fill current is working but autofill all is not, this time after debug run it in the browser and check first before confirming it to me
- Working now
- Why are stock/inventory related ledgers being referenced to in PPE schedule?? check screenshot
- Whats the point of maintain_conversation_log.md and conversation.md if you are not goinfg to follow the instructions therein and update the file. This is ridiculous.
- Do you take me for a fool, pls check the latest screenshot of the conversation file, where is the update??

- Move the notes selection header above Schedules Entry as selection shall happen first and then the entries shall take place. Secondly, check the attached screenshot, I believe this has been wrongly mapped here and is supposed to be part of LLP's and Partnership entity types and not companies
- Wow and in the process you forgot auto renumbering of the notes, now I am looking at note 6 after 4, wonderful job

- And also again you are not updating the conversation file, you should be given a standing ovation

- Continue

- On the schedules entry page add a checkbox next to every input box where data is not populated from the TB and user input is to be provided. The purpose is to leave the decision with the user as to which fields to be displayed further in the final Notes. The system will pass the additional information from Schedules to Notes on the basis of this checkboxes, ticked ones are passed, unticked ones are not.
- For example in the attached screenshot, user should have checkboxes against the fields where their inputs are required, in case no input is available, then he should have the option to uncheck the tickbox so that blank information is not displayed in the notes.
- The default state of the Notes shall be checkbox selected in case data has been populated in the schedule from TB, otherwise unchecked.

- This is required in all the schedules and not only borrowings, i had shared screenshot of borrowings for expalining the requirement.

- Include Accounting Policies as well and proceed with implementaion

<USER_REQUEST>
Restart the servers
</USER_REQUEST>

<AGENT_RESPONSE>
Servers have been restarted successfully.

- **Frontend**: http://localhost:3002
- **Backend**: http://localhost:8002
</AGENT_RESPONSE>

<USER_REQUEST>
Carry a diligence and tell me what information/data./no. is not flowing from Schedules to Notes to Accounts page in the Financial Reports page correctly.
</USER_REQUEST>

<USER_REQUEST>
Also, you are not updating the conversations again
</USER_REQUEST>
