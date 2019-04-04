#!/usr/bin/swift

import Foundation

extension Collection {
  subscript (safe index: Index) -> Element? {
    return indices.contains(index) ? self[index] : nil
  }
}

enum Token: String {
  case inputFilePath = "-i"
  case outputProjectPath = "-o"
}

struct TranslationsContainer: Codable {
  let translations: [Translation]
}

struct Translation: Codable {
  let language: String
  let terms: [Term]
}

struct Term: Codable {
  let key, value: String
}

func termsDefinitionsToString(_ inputArray: [Term]) -> String {
  var stringBuffer = ""
  
  inputArray
    .map { rawTerm in return "\"\(rawTerm.key)\" = \"\(rawTerm.value)\";\n" }
    .forEach { termDefinition in stringBuffer.append(termDefinition) }
  
  return stringBuffer
}

func write(translation: Translation, baseDirURL: URL?) {
  let targetDirURL = (baseDirURL ?? FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!)
    .appendingPathComponent(translation.language.lowercased() + ".lproj")
  let resultURL = targetDirURL.appendingPathComponent("Localizable").appendingPathExtension("strings")
  let processedString = termsDefinitionsToString(translation.terms)
  try? FileManager.default.createDirectory(at: targetDirURL, withIntermediateDirectories: true, attributes: nil)
  try! processedString.data(using: .utf8)!.write(to: resultURL)
}

func main() {
  if CommandLine.arguments.count >= 3 {
    if let inputTokenIndex = CommandLine.arguments.firstIndex(of: Token.inputFilePath.rawValue),
      let filePath = CommandLine.arguments[safe: inputTokenIndex + 1] {
      let localizationFileURL = URL(fileURLWithPath: filePath)
      guard let localizationJSONData = try? Data(contentsOf: localizationFileURL) else {
        print("Input file does not exist ⛔️")
        return
      }
      
      do {
        let translationsContainer = try JSONDecoder().decode(TranslationsContainer.self, from: localizationJSONData)
        let outputDirPath = CommandLine.arguments
          .firstIndex(of: Token.outputProjectPath.rawValue)
          .flatMap { CommandLine.arguments[safe: $0 + 1] }
          .map { URL(fileURLWithPath: $0, isDirectory: true) }
        
        translationsContainer.translations
          .forEach { translation in write(translation: translation, baseDirURL: outputDirPath) }
      } catch {
        print("Cannot process input data")
        print(error.localizedDescription)
      }
    } else {
      print("Pass valid file url ⛔️")
    }
  } else {
    print("Invalid number arguments passed ⛔️")
  }
}

main()
