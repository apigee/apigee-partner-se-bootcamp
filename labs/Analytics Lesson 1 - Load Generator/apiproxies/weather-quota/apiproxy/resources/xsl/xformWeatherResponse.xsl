<xsl:stylesheet
    version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:yweather="http://xml.weather.yahoo.com/ns/rss/1.0"
    xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"
    exclude-result-prefixes="yweather geo"
    >

  <xsl:output
      method="xml"
      omit-xml-declaration="yes"
      indent="yes"
      media-type="string"/>

  <xsl:template match="/rss/channel">
    <response>
      <stamp><xsl:value-of select="lastBuildDate"/></stamp>
      <sunrise><xsl:value-of select="yweather:astronomy/@sunrise"/></sunrise>
      <sunset><xsl:value-of select="yweather:astronomy/@sunset"/></sunset>
      <xsl:apply-templates select="item"/>
    </response>
  </xsl:template>

  <xsl:template match="item">
    <title><xsl:value-of select="title"/></title>
    <xsl:apply-templates select="yweather:condition"/>
    <xsl:apply-templates select="yweather:forecast"/>
  </xsl:template>

  <xsl:template match="yweather:forecast">
    <forecast>
      <xsl:for-each select="@*">
        <xsl:copy-of select="current()"/>
      </xsl:for-each>
    </forecast>
  </xsl:template>

  <xsl:template match="yweather:condition">
    <current>
      <xsl:for-each select="@*">
        <xsl:copy-of select="current()"/>
      </xsl:for-each>
    </current>
  </xsl:template>

</xsl:stylesheet>
