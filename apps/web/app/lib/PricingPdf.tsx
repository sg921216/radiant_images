import * as React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  type DocumentProps,
} from '@react-pdf/renderer';
import { SHOOT_TYPES, type PricingRevision } from '@radiant/shared';
import { formatPrice, packagesFor, titleCase } from './pricing';
const styles = StyleSheet.create({
  page: {
    padding: 42,
    paddingBottom: 65,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#2F3431',
    lineHeight: 1.5,
  },
  brand: { fontSize: 11, marginBottom: 22 },
  title: { fontFamily: 'Times-Roman', fontSize: 30, marginBottom: 20 },
  package: { paddingBottom: 16, marginBottom: 18, borderBottom: '1px solid #b8bfaf' },
  name: { fontFamily: 'Times-Roman', fontSize: 18, marginBottom: 6 },
  price: { fontSize: 15, marginBottom: 9 },
  description: { marginBottom: 9 },
  inclusion: { marginBottom: 3 },
  footer: { marginTop: 20, fontSize: 8, color: '#525B50' },
});
function pricingDocument({
  revision,
}: {
  revision: PricingRevision;
}): React.ReactElement<DocumentProps> {
  return (
    <Document
      title="Radiant Images - Complete pricing schedule"
      author="Radiant Images"
      subject={`Pricing revision ${revision.revisionId}`}
    >
      <>
        {SHOOT_TYPES.map((type) => (
          <Page key={type} size="A4" style={styles.page}>
            <Text style={styles.brand}>Radiant Images | Photography by Rebekah</Text>
            <Text style={styles.title}>{titleCase(type)} pricing</Text>
            {packagesFor(revision, type).map((pkg) => (
              <View key={pkg.id} style={styles.package} wrap={false}>
                <Text style={styles.name}>{pkg.name}</Text>
                <Text style={styles.price}>{formatPrice(pkg.priceCents)}</Text>
                <Text style={styles.description}>{pkg.description}</Text>
                {pkg.inclusions.map((line, index) => (
                  <Text key={index} style={styles.inclusion}>
                    • {line}
                  </Text>
                ))}
              </View>
            ))}
            <Text style={styles.footer}>
              Published {revision.publishedAt.slice(0, 10)} | Revision {revision.revisionId} | USD
            </Text>
          </Page>
        ))}
      </>
    </Document>
  );
}
export async function createPricingPdf(revision: PricingRevision): Promise<Blob> {
  return pdf(pricingDocument({ revision })).toBlob();
}
