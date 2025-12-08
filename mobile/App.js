import React from 'react';
import { Text, View, Button } from 'react-native';
export default function App(){
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Text style={{fontSize:20,fontWeight:'700'}}>WarriorPixel Mobile (Expo)</Text>
      <Button title="Open Tournaments" onPress={() => {}} />
    </View>
  );
}
