<!DOCTYPE html>
<html>
    <head>
        <!-- Meta, title, description and CSS. -->
        <meta charset="utf-8"/>
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
        <title>hotels-get</title>
        <meta name="description" content="" />
        <link href="https://smartdocs.apigee.com/6/static/css/bootstrap.min.css" rel="stylesheet" type="text/css" media="screen" charset="utf-8"/>
        <link href="https://smartdocs.apigee.com/6/static/css/fonts.css" rel="stylesheet" type="text/css" media="screen" charset="utf-8"/>
        <link href="https://smartdocs.apigee.com/6/static/css/main.css" rel="stylesheet" type="text/css" media="screen" charset="utf-8"/>
        <link href="https://smartdocs.apigee.com/6/static/css/header.css" rel="stylesheet" type="text/css" media="screen" charset="utf-8"/>
        <link href="https://smartdocs.apigee.com/6/static/css/codemirror.css" rel="stylesheet" type="text/css" media="screen" charset="utf-8"/>
        <link href="https://smartdocs.apigee.com/6/static/css/prism.css" rel="stylesheet" type="text/css" media="screen" charset="utf-8"/>
    </head>
    <body>
				<!-- Fixed header -->
        <header>
            <div class="content">
                <div class="logo_container">
                    <a href="../../../../doc" title="Back to index">YOUR LOGO HERE</a>
                    <iframe width="420" height="315" src="http://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>

                </div>
            </div>
        </header>
        <!-- Main container -->
        <div class="row" id="method_container">
            <!-- Main content -->
            <div class="col-sm-9" id="method_content">
                <div class="col-sm-12">
                    <!-- Error container -->
                    <div data-role="error_container"></div>
                    <!-- Inline edit Organization admin credential section -->
                    <div class="admin_auth_section hide">
                        <a class="set_admin_credentials hide" href="javascript:void(0)" title="set admin credentials.">Set Admin Credentials...</a>
                        <a class="auth_admin_email" title="reset admin credentials." href="javascript:void(0)"></a>
                        <i title="Clear admin credentials." class="icon-remove"></i>
                    </div>
                    <div>
                        <!-- Resource summary - name, description and resource URL section -->
                        <div class="resource_details">
                            <span id="method_name" data-role="method-name" class="hide">hotels-get</span>
                            <div class="title_container">
                                <div class="verb_container">
                                    <p class="verb get" data-role="verb">get</p>
                                    
                                </div>
                                <h2 data-role="method-title" data-allow-edit="true">hotels-get</h2>
                            </div>
                            <div class="description_and_url_container">
                                <div class="description_container">
                                    <div class="resource_description" data-allow-edit="true" data-role="method-description"></div>
                                </div>
                                <h3>Resource URL</h3>
                                <div class="url_container">
                                    <p data-role="method_url_container">
                                        
                                        <span data-role="host">https://amer-apibaas-prod.apigee.net/appservices/amer-partner7/hospitality</span>
                                        <span data-role="path">/hotels</span>
                                    </p>
                                </div>
                            </div>
                        </div><!--/.resource_details -->
                    </div>
<div class="row">
    <div class="col-sm-12">
                    <div>
                    
                    
                            <h3>Header Parameters</h3>
            <hr>
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
                        <td style="vertical-align:middle">
                                    <span data-role="name">Content-Type</span>
                                    
                        </td>
                        <td>
                            
                            <input type="text" class="form-control" data-role="value" placeholder="" value=""/>
                            
                        </td>
                        <td style="vertical-align:middle">
                            <p data-role="description" data-allow-edit="true">
                                
                            </p>
                        </td>
                    </tr>
                    
                    </tbody>
                </table>
                                    </div>
            
            
                        </div>
                        </div>
                    </div>
                    
                    <!-- Request payload section -->
                    <div class="request_payload">
                        <h3>Request Body</h3>
                        
                        <div data-role="request-payload-docs" class="docs">
                            
                        </div>
                        <div data-role="request-payload-example">
        <textarea class="payload_text" data-format=""></textarea>
                        </div>
                    </div>
                    

                    
                    <div class="operation_container">
                        <!-- Basic authentication, custom token and OAuth 2 authentication container -->
                        <div class="authentication" data-role="authentication_container">
                            <div class="well basicauth" data-role="basic_auth_container">
            <p class="title">HTTP Basic</p>
                                <div class="details">
                                    <a data-toggle="modal" role="button" href="#basicauth_modal" title="Set credentials." class="link_open_basicauth">Set...</a>
                                    <i title="Clear admin credentials." class="icon-remove"></i>
                                </div>
                            </div>
                            <div class="well oauth2" data-role="oauth2_container">
            <p class="title">OAuth 2.0</p>
                                <div class="details">
                                    <a data-toggle="modal" role="button" href="#oauth2_modal" title="Set credentials." class="link_open_oauth2">Set...</a>
                                    <i title="Clear admin credentials." class="icon-remove"></i>
                                </div>
                            </div>
                            <div class="well customtoken" data-role="custom_token_container">
            <p class="title">API Key</p>
                                <div class="details">
                                    <a data-toggle="modal" role="button" href="#customtoken_modal" title="Set credentials." class="link_open_customtoken">Set...</a>
                                    <i title="Clear admin credentials." class="icon-remove"></i>
                                </div>
                            </div>
                        </div>
                        <button id="send_request">Send this request<br/><span>using the values above</span>
                        </button>
                        <a href="javascript:void(0)" class="link_reset_default" title="Reset to default request parameters and body content.">Reset</a>
                    </div>
                    <!-- Request and response tab section -->
                    <div class="request_response_tabs" >
                        <a href="javascript:void(0)" id="link_request_tab" data-role="request-link">Request</a>
                        <a href="javascript:void(0)" id="link_response_tab" data-role="response-link" class="selected">Response</a>
    <a href="javascript:void(0)" id="link_curl_tab" data-role="curl-link">cURL</a>
                    </div>
                    <!-- Request and response container -->
                    <div id="request_response_container">
                        <div class="response" data-role="response-container">
                            <p>Make a request and see the response.</p>
                        </div>
                        <div class="request" data-role="request-container">
        <p>Make a request and see the response.</p>
    </div>
    <div class="curl" data-role="curl-container">
                            <p>Make a request and see the response.</p>
                        </div>
                    </div>
                    
                    
                    
                    
                </div><!--/.col-sm-12 -->
            </div><!-- #method_content -->
<div class="col-sm-3">
    <div class="well well-sm">
        <div class="table-responsive">
            <table class="table table-condensed">
                <div class="resource_summary">
                    <thead>
                    <tr>
                        <td colspan="2">
                            <h4>Resource Summary</h4>
                        </td>
                    </tr>
                    </thead>
                    <tbody>
                    <tr class="authType">
                        <td>
                            <p class="title">Security</p>
                        </td>
                        <td>
                            <p class="data auth_type" data-role="auth-type"></p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <p class="title">Content Type</p>
                        </td>
                        <td>
                            <p class="data" data-role="content-type">
                                
                                    
                                        
                                            application/json<br/>
                                        
                                    
                                
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <p class="title">Category</p>
                        </td>
                        <td>
                            <p class="data" data-role="category">
                                
                            </p>
                        </td>
                    </tr>
                    </tbody>
                </div><!--/.resource_summary -->
            </table>
        </div>
        <!-- Resource summary - right side info section -->
    </div>
</div>
        <div id="working_alert">
            <p>Working...</p>
        </div>
        <!-- Basic authentication modal -->
<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="modal_container" data-role="basic_auth_modal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close button_close_modal" data-dismiss="modal" aria-hidden="true">&times;</button>
                        <h3 class="modal-title">Set Authentication</h3>
                    </div>
                    <div class="modal-body">
                        <form class="form-horizontal">
                            <div class="error_container"></div>
                              <div class="form-group">
                                  <label class="control-label" for="inputEmail">Email/Username</label>
                                  <input  class="form-control" type="text" id="inputEmail" placeholder="Email/Username"/>
                              </div>
                              <div class="form-group">
                                  <label class="control-label" for="inputPassword">Password</label>
                                  <input class="form-control" type="password" id="inputPassword" placeholder="Password"/>
                              </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <p>Your credentials are saved for the session only.</p>
                        <a class="btn btn-primary button_save_modal" href="javascript:void(0)">Save</a>
                        <a class="button_close_modal" href="javascript:void(0)">Cancel</a>
                    </div>
                </div>
                <!-- /.modal-content -->
            </div>
            <!-- /.modal-dialog -->
        </div>
        <!-- /.modal -->
        <!-- OAuth 2 authentication modal -->
<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="modal_container" data-role="oauth2_modal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close button_close_modal" data-dismiss="modal" aria-hidden="true">&times;</button>
                        <h3 class="modal-title">Request se-bootcamp-api-baas permissions</h3>
                    </div>
                    <div class="modal-body">
                        <div class="content">
                            <p>Making se-bootcamp-api-baas API requests requires you to grant access to this app.</p>
                            <p>You will be directed to se-bootcamp-api-baas to approve the use of your credentials and then returned to this page.</p>
                            <p>You can revoke these permissions at any time.</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <p>Your credentials are saved for the session only.</p>
                <a class="btn btn-primary button_save_modal" href="javascript:void(0)">OK</a>
                        <a class="button_close_modal" href="javascript:void(0)">Cancel</a>
                    </div>
                </div>
                <!-- /.modal-content -->
            </div>
            <!-- /.modal-dialog -->
        </div>
        <!-- /.modal -->
        <!-- Custom token authentication modal -->
<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="modal_container" data-role="custom_token_modal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close button_close_modal" data-dismiss="modal" aria-hidden="true">&times;</button>
                        <h3 class="modal-title">Custom Token</h3>
                    </div>
                    <div class="modal-body">
                        <div class="content">
                            <form class="form-horizontal">
                                <div data-role="custom_token_rows">
                                    <div data-role="custom_token_row">
                                        <div class="form-group">
                                            <label class="control-label">Name:</label>
                                            <input type="text" class="form-control" placeholder="Name" data-role="name">
                                        </div>
                                        <div class="form-group">
                                            <label class="control-label">Value:</label>
                                            <input type="text" class="form-control" placeholder="Value" data-role="value">
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="control-label">Header:</label>
                                    <input type="radio" name="custom_token_type" data-role="header">
                                </div><!-- /input-group -->
                                <div class="form-group">
                                    <label class="control-label">Query:</label>
                                    <input type="radio" data-role="query" name="custom_token_type">
                                </div><!-- /input-group -->
                            </form>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <a class="btn btn-primary button_save_modal" href="javascript:void(0)">Ok</a>
                        <a class="button_close_modal" href="javascript:void(0)">Cancel</a>
                    </div>
                </div>
                <!-- /.modal-content -->
            </div>
            <!-- /.modal-dialog -->
        </div>
        <!-- /.modal -->
        <!-- Org admin authentication modal -->
<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="modal_container" data-role="edit_auth_modal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close button_close_modal" data-dismiss="modal" aria-hidden="true">&times;</button>
                        <h3 class="modal-title">Set Organization Admin Credentials</h3>
                    </div>
                    <div class="modal-body">
                        <form class="form-horizontal">
                            <div class="error_container"></div>
                              <div class="form-group">
                                  <label class="control-label" for="inputEmail">Email</label>
                                  <input  class="form-control" type="text" id="inputEmail" placeholder="Email"/>
                              </div>
                              <div class="form-group">
                                  <label class="control-label" for="inputPassword">Password</label>
                                  <input class="form-control" type="password" id="inputPassword" placeholder="Password"/>
                              </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <p>Your credentials are saved for the session only.</p>
                        <a class="btn btn-primary button_save_modal" href="javascript:void(0)">Save</a>
                        <a class="button_close_modal" href="javascript:void(0)">Cancel</a>
                    </div>
                </div>
                <!-- /.modal-content -->
            </div>
            <!-- /.modal-dialog -->
        </div>
        <!-- /.modal -->
        <!-- Confirm the changes modal -->
<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" id="modal_container" data-role="confirm_modal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close button_close_modal" data-dismiss="modal" aria-hidden="true">&times;</button>
                        <h3 class="modal-title">Warning</h3>
                    </div>
                    <div class="modal-body">
                        <div class="content">
                            <p>Your changes have not been saved.</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <a class="btn btn-primary button_save_modal" href="javascript:void(0)">Save</a>
                        <a class="button_close_modal" href="javascript:void(0)">Discard</a>
                    </div>
                </div>
                <!-- /.modal-content -->
            </div>
            <!-- /.modal-dialog -->
        </div>
        <!-- /.modal -->
        <script src="https://smartdocs.apigee.com/6/static/js/jquery_1.7.2.min.js" type="text/javascript"></script>
        <script type="text/javascript">
            // hack to set proxyUrl when not running on mgmt server or inside a Drupal context
            var Drupal = {};
            Drupal.settings = {};
            Drupal.settings.smartdocs = {};
            Drupal.settings.smartdocs.dataProxyUrl = "https://apiconsole-prod.apigee.net/smartdocs/v1/";

            var Apigee = Apigee || {}; // Look for a namespace 'Apigee', if it is not there, creates an empty one.
            Apigee.APIModel = Apigee.APIModel || {}; // Look for a namespace 'APIModel' under 'Apigee', if it is not there, creates an empty one.
            Apigee.APIModel.apiName = "se-bootcamp-api-baas";
            Apigee.APIModel.revisionNumber = "1";
            Apigee.APIModel.organizationName = "amer-partner1";
            Apigee.APIModel.resourceId = "b2813bc7-6bb7-449e-8eb3-2065297e5f05";
            Apigee.APIModel.methodId = "2f103f38-fa1b-486a-bbe7-d191fc4e32ae";
            Apigee.APIModel.methodType ="details";
    Apigee.APIModel.apiKey = "";
    Apigee.APIModel.location = ""; // will be 'header' or 'query'
    Apigee.APIModel.templateAuthName = "";
    var model = {"methods":[],"apiId":"0da5572e-09d7-4351-a45d-7ba8886808dc","body":{"schema":null,"accept":null,"doc":null,"attachments":[],"contentType":null,"parameters":[],"sample":null},"resources":[],"isLatest":null,"resourceSchema":null,"organizationName":"amer-partner1","apiSchema":null,"modifiedBy":null,"security":null,"customAttributes":[{"name":"SWAGGER_METHOD_AUTH","value":"","attributeGroupName":null}],"response":{"schema":null,"errors":[],"doc":null,"contentType":null,"parameters":[],"sample":null},"id":"2f103f38-fa1b-486a-bbe7-d191fc4e32ae","baseUrl":"https:\/\/amer-apibaas-prod.apigee.net\/appservices\/amer-partner7\/hospitality","resourceId":"b2813bc7-6bb7-449e-8eb3-2065297e5f05","apiName":"se-bootcamp-api-baas","verb":"get","description":null,"name":"hotels-get","path":"\/hotels","parameters":[{"schema":null,"dataType":"string","scope":"resource","items":null,"description":null,"name":"Content-Type","allowMultiple":null,"type":"header","required":null,"defaultValue":null,"options":["application\/json"]}],"activeRevisionNumber":null,"releaseVersion":null,"resourceName":"hotels","apiRevisionId":"966cf437-51db-4f56-bbed-2eac24e1e952","key":"2f103f38-fa1b-486a-bbe7-d191fc4e32ae","changeLog":null,"revisionSchema":null,"parameterGroups":[],"tags":null,"latestRevisionNumber":null,"schemas":[],"revisionNumber":1,"createdTime":1447807442882,"modifiedTime":null,"defaultIndexTemplate":null,"samples":null,"isActive":null,"defaultMethodTemplate":null,"createdBy":null,"displayName":null,"revisions":null,"activeRevisionInstance":null};
    Apigee.APIModel.resourceName = "";
    if(model.body && model.body.parameters) {
        for(var i in model.body.parameters) {
            if(model.body.parameters[i].schema) {
                Apigee.APIModel.resourceName = JSON.parse(model.body.parameters[0].schema).$ref;
                Apigee.APIModel.resourceName = Apigee.APIModel.resourceName.split("/");
                Apigee.APIModel.resourceName = Apigee.APIModel.resourceName[Apigee.APIModel.resourceName.length-1];
            }
        }
    }
    var security = [];
    if(model.security) {
        for (i=0;i<model.security.length;i++){
            security.push(JSON.parse(model.security[i]));
        }
    }
    var newAuth = "";
    jQuery("[data-role='auth-type']").text(newAuth);
    for (var i in security){
        for (var keys in security[i]) {
            if(security[i][keys].type) {
                if (security[i][keys].type === "OAUTH2") {
                    newAuth = "OAuth 2.0";
                    secName = keys;
                    jQuery("[data-role='auth-type']").append(newAuth + ", ");
                }
                if (security[i][keys].type === "APIKEY") {
                    newAuth = "API Key";
                    secName = keys;
                    jQuery("[data-role='auth-type']").append(newAuth + ", ");
                    if(security[i][keys].templateauths) {
                        for(var key in security[i][keys].templateauths) {
                            Apigee.APIModel.apiKey = security[i][keys].templateauths[key];
                            Apigee.APIModel.location = security[i][keys].location.toLowerCase();
                            Apigee.APIModel.templateAuthName = key.toLowerCase();
                        }
                    }
                }
                if (security[i][keys].type === "BASIC") {
                    newAuth = "HTTP Basic";
                    secName = keys;
                    jQuery("[data-role='auth-type']").append(newAuth + ", ");
                }
            }
            else if (keys === "api_key") {
                newAuth = "API Key";
                jQuery("[data-role='auth-type']").append(newAuth + ", ");
            }
        }
    }
    if (jQuery("[data-role='auth-type']").text() === "") {
        jQuery("[data-role='auth-type']").append("None");
    }
    var methodVerb = jQuery.trim(jQuery("[data-role='verb']:first").text().toLowerCase()); // Retrieve the verb from the first HTML element.
    var payload = jQuery(".request_payload")
    if (methodVerb != "post" && methodVerb != "put" && methodVerb != "patch") {
        // remove request payload
        payload.remove();
    }
    else {
         // If a sample exists, use it to populate the body payload textarea, else create an example from the api schema to populate the body payload
         if (model.body && model.body.sample) {
             jQuery("textarea.payload_text").val(model.body.sample);
         }
         else if (model.apiSchema && model.apiSchema.expandedSchema) {
             var expandedSchema = JSON.parse(model.apiSchema.expandedSchema);
             var swaggerModel = new Apigee.APIModel.SwaggerModel( Apigee.APIModel.resourceName, expandedSchema[Apigee.APIModel.resourceName]);
             var sampleFromAPISchema = swaggerModel.createJSONSample( false );
             jQuery("textarea.payload_text").val(JSON.stringify(sampleFromAPISchema, null, 4));
         }
         else {
             payload.remove();
         }
    }
        </script>
        <script src="https://smartdocs.apigee.com/6/static/js/bootstrap.js" type="text/javascript"></script>
        <script src="https://smartdocs.apigee.com/6/static/js/codemirror.js" type="text/javascript"></script>
        <script src="https://smartdocs.apigee.com/6/static/js/codemirror_javascript.js" type="text/javascript"></script>
        <script src="https://smartdocs.apigee.com/6/static/js/codemirror_xml.js" type="text/javascript"></script>
        <script src="https://smartdocs.apigee.com/6/static/js/prism.js" type="text/javascript"></script>
        <script src="https://smartdocs.apigee.com/6/static/js/base64_min.js" type="text/javascript"></script>
        <script src="https://smartdocs.apigee.com/6/static/js/model.js" type="text/javascript"></script>
        <script src="https://smartdocs.apigee.com/6/static/js/controller.js" type="text/javascript"></script>
    </body>
</html>
