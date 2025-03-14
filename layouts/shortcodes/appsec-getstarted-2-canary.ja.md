   ライブラリは、アプリケーションからセキュリティデータを収集し、Agent に送信します。Agent は、そのデータを Datadog に送信し、[すぐに使える検出ルール][202]によって、攻撃者のテクニックや潜在的な誤構成にフラグが立てられるため、是正措置を講じることができます。

3.  **Application Security Management の脅威検出を実際に確認するには、既知の攻撃パターンをアプリケーションに送信してください**。例えば、次の curl スクリプトを含むファイルを実行して、[Security Scanner Detected][203] ルールをトリガーします。
    <div>
    <pre><code>for ((i=1;i<=250;i++)); <br>do<br># Target existing service’s routes<br>curl https://your-application-url/existing-route -A dd-test-scanner-log;<br># Target non existing service’s routes<br>curl https://your-application-url/non-existing-route -A dd-test-scanner-log;<br>done</code></pre></div>

    **注**: `dd-test-scanner-log` の値は、最新のリリースでサポートされています。

    アプリケーションを有効にして実行すると、数分後に Datadog の [Application Trace and Signals Explorer][201] に脅威情報が表示されます。

[201]: https://app.datadoghq.com/security/appsec
[202]: /security/default_rules/#cat-application-security
[203]: /security/default_rules/security-scan-detected/
