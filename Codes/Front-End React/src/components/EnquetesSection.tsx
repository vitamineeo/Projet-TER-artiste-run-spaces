
import React from 'react';
import { PieChart, Users } from 'lucide-react';
import PieChartComponent from './PieChart';
import { Card, CardContent } from "@/components/ui/card";

const EnquetesSection = () => {
  return (
    <Card className="overflow-hidden border-none shadow-md">
      <CardContent className="p-6">
        <h2 className="flex items-center text-2xl font-bold mb-6 text-indigo-700">
          <Users className="mr-2 h-6 w-6" />
          Enquête auprès des Espaces
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Question 1</h3>
              <p className="text-gray-600">
                Pouvez-vous nous apporter un témoignage sur la façon dont votre structure répond, 
                à travers ses modalités de fonctionnement, au contexte actuel et/ou celui de son émergence ?
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Question 2</h3>
              <p className="text-gray-600">
                Pensez-vous que votre espace ou l'espace auquel vous avez participé puisse être 
                considéré comme une œuvre ? Et si oui, en quel sens ?
              </p>
            </div>
          </div>
          
          <div className="flex justify-center items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center justify-center">
                <PieChart className="mr-2 h-5 w-5" />
                Espaces considérés comme œuvres
              </h3>
              <PieChartComponent />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnquetesSection;
