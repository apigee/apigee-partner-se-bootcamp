<header>

<div class="content">

<div class="logo_container">[YOUR LOGO HERE](../../../../doc "Back to index")</div>

</div>

</header>

<div class="row" id="method_container">

<div class="col-sm-9" id="method_content">

<div class="col-sm-12">

<div class="admin_auth_section hide">[Set Admin Credentials...](javascript:void(0) "set admin credentials.")[](javascript:void(0) "reset admin credentials.")</div>

<div>

<div class="resource_details"><span id="method_name" data-role="method-name" class="hide">hotels-get</span>

<div class="title_container">

<div class="verb_container">

get

</div>

## hotels-get

</div>

<div class="description_and_url_container">

### Resource URL

<div class="url_container">

<span data-role="host">https://amer-apibaas-prod.apigee.net/appservices/amer-partner7/hospitality</span> <span data-role="path">/hotels</span>

</div>

</div>

</div>

</div>

<div class="row">

<div class="col-sm-12">

<div>

### Header Parameters

* * *

<div class="table-responsive">

<table class="table table-striped">

<thead>

<tr>

<th class="col-sm-2">Name</th>

<th class="col-sm-3">Values</th>

<th class="col-sm-7">Description</th>

</tr>

</thead>

<tbody>

<tr data-role="header-param-list" data-scope="resource">

<td style="vertical-align:middle"><span data-role="name">Content-Type</span></td>

<td><input type="text" class="form-control" data-role="value" placeholder="" value=""></td>

</tr>

</tbody>

</table>

</div>

</div>

</div>

</div>

<div class="request_payload">

### Request Body

<div data-role="request-payload-example"><textarea class="payload_text" data-format=""></textarea></div>

</div>

<div class="operation_container">

<div class="authentication" data-role="authentication_container">

<div class="well basicauth" data-role="basic_auth_container">

HTTP Basic

<div class="details">[Set...](#basicauth_modal "Set credentials.")</div>

</div>

<div class="well oauth2" data-role="oauth2_container">

OAuth 2.0

<div class="details">[Set...](#oauth2_modal "Set credentials.")</div>

</div>

<div class="well customtoken" data-role="custom_token_container">

API Key

<div class="details">[Set...](#customtoken_modal "Set credentials.")</div>

</div>

</div>

<button id="send_request">Send this request  
<span>using the values above</span></button> [Reset](javascript:void(0) "Reset to default request parameters and body content.")</div>

<div class="request_response_tabs">[Request](javascript:void(0)) [Response](javascript:void(0)) [cURL](javascript:void(0))</div>

<div id="request_response_container">

<div class="response" data-role="response-container">

Make a request and see the response.

</div>

<div class="request" data-role="request-container">

Make a request and see the response.

</div>

<div class="curl" data-role="curl-container">

Make a request and see the response.

</div>

</div>

</div>

</div>

<div class="col-sm-3">

<div class="well well-sm">

<div class="table-responsive">

<table class="table table-condensed">

<thead>

<tr>

<td colspan="2">

#### Resource Summary

</td>

</tr>

</thead>

<tbody>

<tr class="authType">

<td>

Security

</td>

</tr>

<tr>

<td>

Content Type

</td>

<td>

application/json  

</td>

</tr>

<tr>

<td>

Category

</td>

</tr>

</tbody>

</table>

</div>

</div>

</div>

<div id="working_alert">

Working...

</div>

<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="modal_container" data-role="basic_auth_modal">

<div class="modal-dialog">

<div class="modal-content">

<div class="modal-header"><button type="button" class="close button_close_modal" data-dismiss="modal" aria-hidden="true">×</button>

### Set Authentication

</div>

<div class="modal-body">

<form class="form-horizontal">

<div class="form-group"><label class="control-label" for="inputEmail">Email/Username</label> <input class="form-control" type="text" id="inputEmail" placeholder="Email/Username"></div>

<div class="form-group"><label class="control-label" for="inputPassword">Password</label> <input class="form-control" type="password" id="inputPassword" placeholder="Password"></div>

</form>

</div>

<div class="modal-footer">

Your credentials are saved for the session only.

[Save](javascript:void(0)) [Cancel](javascript:void(0))</div>

</div>

</div>

</div>

<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="modal_container" data-role="oauth2_modal">

<div class="modal-dialog">

<div class="modal-content">

<div class="modal-header"><button type="button" class="close button_close_modal" data-dismiss="modal" aria-hidden="true">×</button>

### Request se-bootcamp-api-baas permissions

</div>

<div class="modal-body">

<div class="content">

Making se-bootcamp-api-baas API requests requires you to grant access to this app.

You will be directed to se-bootcamp-api-baas to approve the use of your credentials and then returned to this page.

You can revoke these permissions at any time.

</div>

</div>

<div class="modal-footer">

Your credentials are saved for the session only.

[OK](javascript:void(0)) [Cancel](javascript:void(0))</div>

</div>

</div>

</div>

<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="modal_container" data-role="custom_token_modal">

<div class="modal-dialog">

<div class="modal-content">

<div class="modal-header"><button type="button" class="close button_close_modal" data-dismiss="modal" aria-hidden="true">×</button>

### Custom Token

</div>

<div class="modal-body">

<div class="content">

<form class="form-horizontal">

<div data-role="custom_token_rows">

<div data-role="custom_token_row">

<div class="form-group"><label class="control-label">Name:</label> <input type="text" class="form-control" placeholder="Name" data-role="name"></div>

<div class="form-group"><label class="control-label">Value:</label> <input type="text" class="form-control" placeholder="Value" data-role="value"></div>

</div>

</div>

<div class="form-group"><label class="control-label">Header:</label> <input type="radio" name="custom_token_type" data-role="header"></div>

<div class="form-group"><label class="control-label">Query:</label> <input type="radio" data-role="query" name="custom_token_type"></div>

</form>

</div>

</div>

<div class="modal-footer">[Ok](javascript:void(0)) [Cancel](javascript:void(0))</div>

</div>

</div>

</div>

<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="modal_container" data-role="edit_auth_modal">

<div class="modal-dialog">

<div class="modal-content">

<div class="modal-header"><button type="button" class="close button_close_modal" data-dismiss="modal" aria-hidden="true">×</button>

### Set Organization Admin Credentials

</div>

<div class="modal-body">

<form class="form-horizontal">

<div class="form-group"><label class="control-label" for="inputEmail">Email</label> <input class="form-control" type="text" id="inputEmail" placeholder="Email"></div>

<div class="form-group"><label class="control-label" for="inputPassword">Password</label> <input class="form-control" type="password" id="inputPassword" placeholder="Password"></div>

</form>

</div>

<div class="modal-footer">

Your credentials are saved for the session only.

[Save](javascript:void(0)) [Cancel](javascript:void(0))</div>

</div>

</div>

</div>

<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="modal_container" data-role="confirm_modal">

<div class="modal-dialog">

<div class="modal-content">

<div class="modal-header"><button type="button" class="close button_close_modal" data-dismiss="modal" aria-hidden="true">×</button>

### Warning

</div>

<div class="modal-body">

<div class="content">

Your changes have not been saved.

</div>

</div>

<div class="modal-footer">[Save](javascript:void(0)) [Discard](javascript:void(0))</div>

</div>

</div>

</div>

<script type="text/javascript">// hack to set proxyUrl when not running on mgmt server or inside a Drupal context var Drupal = {}; Drupal.settings = {}; Drupal.settings.smartdocs = {}; Drupal.settings.smartdocs.dataProxyUrl = "https://apiconsole-prod.apigee.net/smartdocs/v1/"; var Apigee = Apigee || {}; // Look for a namespace 'Apigee', if it is not there, creates an empty one. Apigee.APIModel = Apigee.APIModel || {}; // Look for a namespace 'APIModel' under 'Apigee', if it is not there, creates an empty one. Apigee.APIModel.apiName = "se-bootcamp-api-baas"; Apigee.APIModel.revisionNumber = "1"; Apigee.APIModel.organizationName = "amer-partner1"; Apigee.APIModel.resourceId = "b2813bc7-6bb7-449e-8eb3-2065297e5f05"; Apigee.APIModel.methodId = "2f103f38-fa1b-486a-bbe7-d191fc4e32ae"; Apigee.APIModel.methodType ="details"; Apigee.APIModel.apiKey = ""; Apigee.APIModel.location = ""; // will be 'header' or 'query' Apigee.APIModel.templateAuthName = ""; var model = {"methods":[],"apiId":"0da5572e-09d7-4351-a45d-7ba8886808dc","body":{"schema":null,"accept":null,"doc":null,"attachments":[],"contentType":null,"parameters":[],"sample":null},"resources":[],"isLatest":null,"resourceSchema":null,"organizationName":"amer-partner1","apiSchema":null,"modifiedBy":null,"security":null,"customAttributes":[{"name":"SWAGGER_METHOD_AUTH","value":"","attributeGroupName":null}],"response":{"schema":null,"errors":[],"doc":null,"contentType":null,"parameters":[],"sample":null},"id":"2f103f38-fa1b-486a-bbe7-d191fc4e32ae","baseUrl":"https:\/\/amer-apibaas-prod.apigee.net\/appservices\/amer-partner7\/hospitality","resourceId":"b2813bc7-6bb7-449e-8eb3-2065297e5f05","apiName":"se-bootcamp-api-baas","verb":"get","description":null,"name":"hotels-get","path":"\/hotels","parameters":[{"schema":null,"dataType":"string","scope":"resource","items":null,"description":null,"name":"Content-Type","allowMultiple":null,"type":"header","required":null,"defaultValue":null,"options":["application\/json"]}],"activeRevisionNumber":null,"releaseVersion":null,"resourceName":"hotels","apiRevisionId":"966cf437-51db-4f56-bbed-2eac24e1e952","key":"2f103f38-fa1b-486a-bbe7-d191fc4e32ae","changeLog":null,"revisionSchema":null,"parameterGroups":[],"tags":null,"latestRevisionNumber":null,"schemas":[],"revisionNumber":1,"createdTime":1447807442882,"modifiedTime":null,"defaultIndexTemplate":null,"samples":null,"isActive":null,"defaultMethodTemplate":null,"createdBy":null,"displayName":null,"revisions":null,"activeRevisionInstance":null}; Apigee.APIModel.resourceName = ""; if(model.body && model.body.parameters) { for(var i in model.body.parameters) { if(model.body.parameters[i].schema) { Apigee.APIModel.resourceName = JSON.parse(model.body.parameters[0].schema).$ref; Apigee.APIModel.resourceName = Apigee.APIModel.resourceName.split("/"); Apigee.APIModel.resourceName = Apigee.APIModel.resourceName[Apigee.APIModel.resourceName.length-1]; } } } var security = []; if(model.security) { for (i=0;i<model.security.length;i++){ security.push(JSON.parse(model.security[i])); } } var newAuth = ""; jQuery("[data-role='auth-type']").text(newAuth); for (var i in security){ for (var keys in security[i]) { if(security[i][keys].type) { if (security[i][keys].type === "OAUTH2") { newAuth = "OAuth 2.0"; secName = keys; jQuery("[data-role='auth-type']").append(newAuth + ", "); } if (security[i][keys].type === "APIKEY") { newAuth = "API Key"; secName = keys; jQuery("[data-role='auth-type']").append(newAuth + ", "); if(security[i][keys].templateauths) { for(var key in security[i][keys].templateauths) { Apigee.APIModel.apiKey = security[i][keys].templateauths[key]; Apigee.APIModel.location = security[i][keys].location.toLowerCase(); Apigee.APIModel.templateAuthName = key.toLowerCase(); } } } if (security[i][keys].type === "BASIC") { newAuth = "HTTP Basic"; secName = keys; jQuery("[data-role='auth-type']").append(newAuth + ", "); } } else if (keys === "api_key") { newAuth = "API Key"; jQuery("[data-role='auth-type']").append(newAuth + ", "); } } } if (jQuery("[data-role='auth-type']").text() === "") { jQuery("[data-role='auth-type']").append("None"); } var methodVerb = jQuery.trim(jQuery("[data-role='verb']:first").text().toLowerCase()); // Retrieve the verb from the first HTML element. var payload = jQuery(".request_payload") if (methodVerb != "post" && methodVerb != "put" && methodVerb != "patch") { // remove request payload payload.remove(); } else { // If a sample exists, use it to populate the body payload textarea, else create an example from the api schema to populate the body payload if (model.body && model.body.sample) { jQuery("textarea.payload_text").val(model.body.sample); } else if (model.apiSchema && model.apiSchema.expandedSchema) { var expandedSchema = JSON.parse(model.apiSchema.expandedSchema); var swaggerModel = new Apigee.APIModel.SwaggerModel( Apigee.APIModel.resourceName, expandedSchema[Apigee.APIModel.resourceName]); var sampleFromAPISchema = swaggerModel.createJSONSample( false ); jQuery("textarea.payload_text").val(JSON.stringify(sampleFromAPISchema, null, 4)); } else { payload.remove(); } }</script></div>
