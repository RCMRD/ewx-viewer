Tool rules - Don't be a tool - please obey

1.  Only NextGen team should modify tools/shared.  If a tool needs a slight modification for another project,
this could be brought up to the nextGen team and they can determine if they can generalize the tool more or if 
the project should just copy a shared tool into their own directory.
2.  Similiar to #1, no project should modify other project tools.  See if tool can be generalized the nextGen team
or if they should just copy into their own directory and modify.
3.  In the template.json file, if the tool has an external js file use the "import" parameter.  Leave the .js off the filename.

Example of tools structure

Shared Path
File - /tools/shared/cMapWindow/cMapWindow.js
Template.json settings for the above tool
"name": "cMapWindow",
"import": "tools.shared.cMapWindow.cMapWindow",

Example of mtbs tool
File - /tools/mtbs/cStateTool/cStateTool.js
Template.json settings for the above tool
"name": "cStateTool",
"import": "tools.mtbs.cStateTool.cStateTool",