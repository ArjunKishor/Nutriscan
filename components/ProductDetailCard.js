// components/ProductDetailCard.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts'; // You'll need to install this
import {
    THEME_COLOR_PRIMARY,
    TEXT_COLOR_PRIMARY,
    TEXT_COLOR_SECONDARY,
    BORDER_COLOR,
    CARD_BACKGROUND_COLOR,
} from '../config/dummyData'; // Or your main constants file

const screenWidth = Dimensions.get('window').width;

const ProductDetailCard = ({ product, onClearProduct }) => {
  const [showAlternativesView, setShowAlternativesView] = useState(false);

  if (!product) return null;

  const pieData = product.nutritionBreakdown ? [
    { value: product.nutritionBreakdown.carbohydrates, color: '#3B71CA', text: `${product.nutritionBreakdown.carbohydrates}%`, label: 'Carbs' },
    { value: product.nutritionBreakdown.fat, color: '#54B4D3', text: `${product.nutritionBreakdown.fat}%`, label: 'Fat'},
    { value: product.nutritionBreakdown.protein, color: '#E4A11B', text: `${product.nutritionBreakdown.protein}%`, label: 'Protein' },
    { value: product.nutritionBreakdown.sugar, color: '#DC4C64', text: `${product.nutritionBreakdown.sugar}%`, label: 'Sugar' },
  ].filter(item => item.value > 0) : []; // Filter out zero values for cleaner chart

  const renderAlternativeItem = ({ item }) => (
    <View style={styles.alternativeItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.altImage} />
      <View style={styles.altTextContainer}>
        <Text style={styles.altName}>{item.name}</Text>
        <Text style={styles.altBrand}>{item.brand}</Text>
        <Text style={styles.altDescription}>{item.description}</Text>
        <Text style={styles.altNutritionScore}>{item.nutritionScore}</Text>
      </View>
      <TouchableOpacity style={styles.altViewDetailsButton}>
        <Text style={styles.altViewDetailsText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity onPress={onClearProduct} style={styles.closeButton}>
        <Ionicons name="close-circle" size={30} color={TEXT_COLOR_SECONDARY} />
      </TouchableOpacity>

      <View style={styles.headerSection}>
         <Text style={styles.mainTitle}>{showAlternativesView ? "Alternatives & Recommendations" : "Product Details"}</Text>
      </View>

      {!showAlternativesView ? (
        <>
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutritional Facts</Text>
            <Text style={styles.productInfo}>
              Calories: {product.calories} KCal, Protein: {product.protein}g, Carbs: {product.carbs}g, Fat: {product.fat}g
            </Text>
            <Text style={styles.productInfoSmall}>Ingredients: {product.ingredients}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allergens:</Text>
            <View style={styles.tagContainer}>
              {product.allergens.map((allergen, index) => (
                <View key={index} style={[styles.tag, styles.allergenTag]}>
                  <Text style={styles.tagText}>{allergen}</Text>
                </View>
              ))}
            </View>
          </View>

          {product.healthAlerts && product.healthAlerts.length > 0 && (
            <View style={[styles.section, styles.healthAlertSection]}>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
                <Ionicons name="warning-outline" size={20} color="#D35400" style={{marginRight: 5}}/>
                <Text style={[styles.sectionTitle, {color: '#D35400'}]}>Health Risk Alerts</Text>
              </View>
              {product.healthAlerts.map((alert, index) => (
                <Text key={index} style={styles.healthAlertText}>• {alert.title}: {alert.description}</Text>
              ))}
            </View>
          )}

          {pieData.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients Rate</Text>
                <View style={styles.pieChartContainer}>
                    <PieChart
                        data={pieData}
                        donut
                        showText
                        textColor="black"
                        radius={screenWidth * 0.22}
                        innerRadius={screenWidth * 0.10}
                        textSize={10}
                        focusOnPress
                        // showValuesAsLabels // If you want values inside slices
                        // sectionAutoFocus // if you want animation
                        centerLabelComponent={() => <Text style={{fontSize: 18, fontWeight: 'bold'}}>{product.calories}{"\n"}KCal</Text>}
                    />
                    <View style={styles.legendContainer}>
                        {pieData.map((item, index) => (
                            <View key={index} style={styles.legendItem}>
                                <View style={[styles.legendColorBox, {backgroundColor: item.color}]} />
                                <Text style={styles.legendText}>{item.label} ({item.text})</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
          )}

          <TouchableOpacity style={styles.ctaButton} onPress={() => setShowAlternativesView(true)}>
            <Text style={styles.ctaButtonText}>View Alternatives</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <FlatList
            data={product.alternatives}
            renderItem={renderAlternativeItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.noAlternativesText}>No alternatives found for this product.</Text>}
            contentContainerStyle={{paddingBottom: 20}}
          />
           <TouchableOpacity style={styles.ctaButton} onPress={() => setShowAlternativesView(false)}>
            <Ionicons name="arrow-back-outline" size={20} color="#fff" style={{marginRight: 5}}/>
            <Text style={styles.ctaButtonText}>Back to Details</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: CARD_BACKGROUND_COLOR,
    borderRadius: 20,
    padding: 15,
    marginVertical: 10,
    width: screenWidth * 0.92, // Make it slightly less than full width
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  headerSection: {
    marginBottom: 15,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR_PRIMARY,
    textAlign: 'center',
  },
  productImage: {
    width: '100%',
    height: screenWidth * 0.5,
    borderRadius: 15,
    marginBottom: 15,
    backgroundColor: BORDER_COLOR,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: TEXT_COLOR_PRIMARY,
    marginBottom: 10,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_COLOR_PRIMARY,
    marginBottom: 8,
  },
  productInfo: {
    fontSize: 14,
    color: TEXT_COLOR_SECONDARY,
    lineHeight: 20,
    marginBottom: 5,
  },
  productInfoSmall: {
    fontSize: 12,
    color: TEXT_COLOR_SECONDARY,
    lineHeight: 18,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  allergenTag: {
    backgroundColor: '#FFE0B2', // Light orange for allergens
  },
  tagText: {
    fontSize: 12,
    color: '#BF360C', // Darker orange text
    fontWeight: '500',
  },
  healthAlertSection: {
    backgroundColor: '#FFF3E0', // Very light orange background
    borderColor: '#FFCC80',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  healthAlertText: {
    fontSize: 13,
    color: '#C65102',
    lineHeight: 18,
    marginBottom: 3,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 10,
    flexDirection: 'row', // For pie and legend side-by-side
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  legendContainer: {
    marginLeft: 20, // Space between pie and legend
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendColorBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    color: TEXT_COLOR_SECONDARY,
  },
  ctaButton: {
    backgroundColor: THEME_COLOR_PRIMARY,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alternativeItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  altImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: BORDER_COLOR,
  },
  altTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  altName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: TEXT_COLOR_PRIMARY,
  },
  altBrand: {
      fontSize: 12,
      color: TEXT_COLOR_SECONDARY,
      marginBottom: 3,
  },
  altDescription: {
    fontSize: 12,
    color: TEXT_COLOR_SECONDARY,
    lineHeight: 16,
    marginBottom: 4,
  },
  altNutritionScore: {
    fontSize: 11,
    color: THEME_COLOR_PRIMARY,
    fontWeight: '600',
  },
  altViewDetailsButton: {
    backgroundColor: THEME_COLOR_PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  altViewDetailsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noAlternativesText: {
    textAlign: 'center',
    color: TEXT_COLOR_SECONDARY,
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default ProductDetailCard;